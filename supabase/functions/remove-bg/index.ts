// supabase/functions/remove-bg/index.ts
// Deploy: supabase functions deploy remove-bg
// Env vars needed:
//   REMOVE_BG_API_KEY  → from remove.bg dashboard
//   SUPABASE_URL       → set automatically by Supabase
//   SUPABASE_SERVICE_ROLE_KEY → set automatically by Supabase

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Parse request body ─────────────────────────────────────────────
    const { outfit_id, image_url } = await req.json();

    if (!outfit_id || !image_url) {
      return new Response(
        JSON.stringify({ error: "outfit_id and image_url are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. Get env vars ───────────────────────────────────────────────────
    const removeBgKey        = Deno.env.get("REMOVE_BG_API_KEY");
    const supabaseUrl        = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!removeBgKey) {
      return new Response(
        JSON.stringify({ error: "REMOVE_BG_API_KEY is not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 3. Call remove.bg API ─────────────────────────────────────────────
    const formData = new FormData();
    formData.append("image_url", image_url);
    formData.append("size", "auto");       // best quality, uses more credits
    formData.append("format", "png");      // PNG preserves transparency
    formData.append("type", "person");     // optimised for clothing/person shots

    const removeBgRes = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": removeBgKey,
      },
      body: formData,
    });

    if (!removeBgRes.ok) {
      const errText = await removeBgRes.text();
      console.error("[remove-bg] API error:", removeBgRes.status, errText);
      return new Response(
        JSON.stringify({
          error: "remove.bg API request failed",
          detail: errText,
          status: removeBgRes.status,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 4. Get the processed image bytes ─────────────────────────────────
    const imageBuffer = await removeBgRes.arrayBuffer();

    if (imageBuffer.byteLength === 0) {
      return new Response(
        JSON.stringify({ error: "remove.bg returned an empty image" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 5. Upload processed PNG to Supabase Storage ───────────────────────
    // We need service role to write to storage from an Edge Function
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract user_id from the outfit row so we store under the right folder
    const { data: outfit, error: outfitErr } = await supabase
      .from("outfits")
      .select("user_id")
      .eq("id", outfit_id)
      .single();

    if (outfitErr || !outfit) {
      return new Response(
        JSON.stringify({ error: "Outfit not found", detail: outfitErr?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const filePath = `${outfit.user_id}/${outfit_id}-processed.png`;

    const { error: uploadErr } = await supabase.storage
      .from("outfit-photos-processed")
      .upload(filePath, imageBuffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: true,           // overwrite if already exists (re-runs are safe)
      });

    if (uploadErr) {
      console.error("[remove-bg] storage upload error:", uploadErr);
      return new Response(
        JSON.stringify({ error: "Storage upload failed", detail: uploadErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 6. Get public URL ─────────────────────────────────────────────────
    const { data: urlData } = supabase.storage
      .from("outfit-photos-processed")
      .getPublicUrl(filePath);

    const processedUrl = urlData?.publicUrl ?? null;

    // ── 7. Update outfit row with processed_image_url ─────────────────────
    const { error: updateErr } = await supabase
      .from("outfits")
      .update({
        processed_image_url: processedUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", outfit_id);

    if (updateErr) {
      console.error("[remove-bg] DB update error:", updateErr);
      // Don't fail — image is uploaded, just log the error
    }

    // ── 8. Return success ─────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        outfit_id,
        processed_image_url: processedUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err) {
    console.error("[remove-bg] unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
