import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { outfit_id, image_url } = await req.json();

    // Auth check
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace("Bearer ", "") ?? ""
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch current credits — needed both to check and to compute remaining
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("scan_credits")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.scan_credits <= 0) {
      // Status 200 is deliberate — the client only reads tagResult.error when
      // the HTTP status is 2xx. A 402/403 here would route into tagError instead,
      // and tagError.message doesn't contain "no_credits", so Capture.jsx would
      // never catch it.
      return new Response(JSON.stringify({ error: "no_credits" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call OpenAI Vision
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // cheaper than gpt-4o, still great for fashion tagging
        max_tokens: 300,
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this outfit photo. Return a JSON object with these keys:
                - tags: array of style tags (e.g. ["minimalist", "monochrome", "casual"])
                - colors: array of dominant colors (e.g. ["black", "white"])
                - categories: array of clothing types worn (e.g. ["top", "jeans", "sneakers"])
                - vibe: one sentence describing the overall look.
                Respond with raw JSON only, no markdown.`
            },
            { type: "image_url", image_url: { url: image_url, detail: "low" } }
          ]
        }]
      })
    });

    const openaiData = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error("[analyze-outfit] OpenAI error:", openaiData);
      return new Response(JSON.stringify({ error: `OpenAI API error: ${openaiData?.error?.message ?? "unknown"}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = openaiData.choices?.[0]?.message?.content ?? "{}";
    let parsed;
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    // Save tags to outfit_tags
    if (parsed.tags?.length) {
      const tagRows = parsed.tags.map((tag: string) => ({
        outfit_id,
        tag_type: "style",
        tag_value: tag,
        confidence: 0.9,
      }));
      await supabase.from("outfit_tags").upsert(tagRows);
    }

    // Deduct one credit now that the scan succeeded
    const newCredits = profile.scan_credits - 1;
    await supabase.from("profiles").update({ scan_credits: newCredits }).eq("id", user.id);

    return new Response(JSON.stringify({ success: true, ...parsed, credits_remaining: newCredits }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[analyze-outfit] error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});