// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
// };

// serve(async (req) => {
//   if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

//   try {
//     const { outfit_id, image_url } = await req.json();

//     // Auth check
//     const authHeader = req.headers.get("Authorization");
//     const supabase = createClient(
//       Deno.env.get("SUPABASE_URL")!,
//       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
//     );
//     const { data: { user }, error: authError } = await supabase.auth.getUser(
//       authHeader?.replace("Bearer ", "") ?? ""
//     );
//     if (authError || !user) {
//       return new Response(JSON.stringify({ error: "Unauthorized" }), {
//         status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
//       });
//     }

//     // Fetch current credits — needed both to check and to compute remaining
//     const { data: profile, error: profileError } = await supabase
//       .from("profiles")
//       .select("scan_credits")
//       .eq("id", user.id)
//       .single();

//     if (profileError || !profile) {
//       return new Response(JSON.stringify({ error: "Profile not found" }), {
//         status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
//       });
//     }

//     if (profile.scan_credits <= 0) {
//       // Status 200 is deliberate — the client only reads tagResult.error when
//       // the HTTP status is 2xx. A 402/403 here would route into tagError instead,
//       // and tagError.message doesn't contain "no_credits", so Capture.jsx would
//       // never catch it.
//       return new Response(JSON.stringify({ error: "no_credits" }), {
//         status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
//       });
//     }

//     // Call OpenAI Vision
//     const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         model: "gpt-4o-mini", // cheaper than gpt-4o, still great for fashion tagging
//         max_tokens: 300,
//         messages: [{
//           role: "user",
//           content: [
//             {
//               type: "text",
//               text: `Analyze this outfit photo. Return a JSON object with these keys:
//                 - tags: array of style tags (e.g. ["minimalist", "monochrome", "casual"])
//                 - colors: array of dominant colors (e.g. ["black", "white"])
//                 - categories: array of clothing types worn (e.g. ["top", "jeans", "sneakers"])
//                 - vibe: one sentence describing the overall look.
//                 Respond with raw JSON only, no markdown.`
//             },
//             { type: "image_url", image_url: { url: image_url, detail: "low" } }
//           ]
//         }]
//       })
//     });

//     const openaiData = await openaiRes.json();

//     if (!openaiRes.ok) {
//       console.error("[analyze-outfit] OpenAI error:", openaiData);
//       return new Response(JSON.stringify({ error: `OpenAI API error: ${openaiData?.error?.message ?? "unknown"}` }), {
//         status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
//       });
//     }

//     const raw = openaiData.choices?.[0]?.message?.content ?? "{}";
//     let parsed;
//     try { parsed = JSON.parse(raw); } catch { parsed = {}; }

//     // Save tags to outfit_tags
//     if (parsed.tags?.length) {
//       const tagRows = parsed.tags.map((tag: string) => ({
//         outfit_id,
//         tag_type: "style",
//         tag_value: tag,
//         confidence: 0.9,
//       }));
//       await supabase.from("outfit_tags").upsert(tagRows);
//     }

//     // Deduct one credit now that the scan succeeded
//     const newCredits = profile.scan_credits - 1;
//     await supabase.from("profiles").update({ scan_credits: newCredits }).eq("id", user.id);

//     return new Response(JSON.stringify({ success: true, ...parsed, credits_remaining: newCredits }), {
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });

//   } catch (err) {
//     console.error("[analyze-outfit] error:", err);
//     return new Response(JSON.stringify({ error: err.message }), {
//       status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });
//   }
// });
// supabase/functions/analyze-outfit/index.ts
// Deploy: supabase functions deploy analyze-outfit
// Env vars needed:
//   GEMINI_API_KEY             → from Google AI Studio (aistudio.google.com)
//   SUPABASE_URL               → set automatically by Supabase
//   SUPABASE_SERVICE_ROLE_KEY  → set automatically by Supabase

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // ── CORS preflight ──────────────────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Parse request ──────────────────────────────────────────────────────
    const { outfit_id, image_url } = await req.json();

    if (!outfit_id || !image_url) {
      return new Response(
        JSON.stringify({ error: "outfit_id and image_url are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. Env vars ───────────────────────────────────────────────────────────
    const geminiKey          = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl        = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── 3. Fetch image as base64 ──────────────────────────────────────────────
    console.log("[analyze-outfit] Fetching image:", image_url);

    const imgRes = await fetch(image_url);
    if (!imgRes.ok) {
      throw new Error(`Failed to fetch image: ${imgRes.status} ${imgRes.statusText}`);
    }
    const imgBuffer  = await imgRes.arrayBuffer();
    const imgBytes   = new Uint8Array(imgBuffer);
    const imgBinary  = imgBytes.reduce((acc, byte) => acc + String.fromCharCode(byte), "");
    const imageData  = btoa(imgBinary);
    const mimeType   = imgRes.headers.get("content-type") ?? "image/jpeg";

    // ── 4. Call Gemini Vision API ─────────────────────────────────────────────
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;

    const prompt = `You are a fashion analyst AI. Analyze this outfit photo and return a JSON object.

Return ONLY valid JSON with no markdown, no backticks, no explanation. Use this exact structure:

{
  "tags": [
    { "tag": "black turtleneck", "confidence": 0.95, "category": "item" },
    { "tag": "minimalist", "confidence": 0.90, "category": "style" },
    { "tag": "navy blue", "confidence": 0.88, "category": "color" },
    { "tag": "floral pattern", "confidence": 0.75, "category": "pattern" },
    { "tag": "business casual", "confidence": 0.82, "category": "occasion" },
    { "tag": "autumn", "confidence": 0.70, "category": "season" }
  ],
  "dominant_colors": ["#1a1a2e", "#e8d5b7", "#4a7c6b"],
  "style_summary": "A clean minimalist look with monochromatic tones.",
  "occasion": "business casual",
  "season": "autumn"
}

Categories must be one of: color, style, item, pattern, occasion, season, other.
Confidence is a float between 0.0 and 1.0.
Generate 6-12 tags covering the most prominent features.
dominant_colors should be 2-4 hex color codes from the outfit.`;

    const geminiBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: imageData } },
          ],
        },
      ],
      generationConfig: {
        temperature:     0.2,
        topK:            32,
        topP:            1,
        maxOutputTokens: 1024,
      },
    };

    console.log("[analyze-outfit] Calling Gemini API...");
    const geminiRes = await fetch(geminiUrl, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(geminiBody),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[analyze-outfit] Gemini error:", geminiRes.status, errText);
      return new Response(
        JSON.stringify({ error: "Gemini API request failed", detail: errText, status: geminiRes.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiJson = await geminiRes.json();
    const rawText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      return new Response(
        JSON.stringify({ error: "Gemini returned an empty response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 5. Parse Gemini response ──────────────────────────────────────────────
    const cleanText = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error("[analyze-outfit] JSON parse error:", parseErr, "\nRaw:", rawText);
      return new Response(
        JSON.stringify({ error: "Failed to parse Gemini response as JSON", raw: rawText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { tags = [], dominant_colors = [], style_summary = "", occasion = "", season = "" } = parsed;

    if (!Array.isArray(tags) || tags.length === 0) {
      return new Response(
        JSON.stringify({ error: "Gemini returned no tags", parsed }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 6. Clear existing tags (safe re-run) ──────────────────────────────────
    await supabase
      .from("outfit_tags")
      .delete()
      .eq("outfit_id", outfit_id);

    // ── 7. Insert new tags ────────────────────────────────────────────────────
    const tagRows = tags.map((t) => ({
      outfit_id:  outfit_id,
      tag_value:  t.tag,
      tag_type:   t.category   ?? "other",
      confidence: t.confidence ?? 0.5,
    }));

    const { error: insertErr } = await supabase
      .from("outfit_tags")
      .insert(tagRows);

    if (insertErr) {
      console.error("[analyze-outfit] tag insert error:", insertErr);
      return new Response(
        JSON.stringify({ error: "Failed to insert tags", detail: insertErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 8. Stamp outfit updated_at ────────────────────────────────────────────
    await supabase
      .from("outfits")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", outfit_id);

    // ── 9. Return success ─────────────────────────────────────────────────────
    console.log(`[analyze-outfit] Done. ${tagRows.length} tags for outfit ${outfit_id}`);

    return new Response(
      JSON.stringify({
        success:         true,
        outfit_id,
        tag_count:       tagRows.length,
        tags:            tagRows,
        dominant_colors,
        style_summary,
        occasion,
        season,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[analyze-outfit] unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});