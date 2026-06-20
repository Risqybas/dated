// src/hooks/useAnalyzeOutfit.js
// Calls the analyze-outfit Supabase Edge Function.
//
// Usage (in Capture.jsx, after the image is uploaded):
//
//   const { analyzeOutfit, loading, error, tags } = useAnalyzeOutfit();
//
//   // After successful upload:
//   const result = await analyzeOutfit(outfit.id, outfit.image_url);
//   // result.tags → [{ tag, confidence }, ...]

import { useCallback, useState } from "react";
import { supabase } from "../lib/supabase";

export function useAnalyzeOutfit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tags, setTags] = useState([]);

  /**
   * @param {string} outfitId  - UUID of the outfit row
   * @param {string} imageUrl  - Public URL of the outfit image
   * @returns {{ tags: Array<{ tag: string, confidence: number }> } | null}
   */
  const analyzeOutfit = useCallback(async (outfitId, imageUrl) => {
    setLoading(true);
    setError(null);
    setTags([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "analyze-outfit",
        { body: { outfit_id: outfitId, image_url: imageUrl } }
      );

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error ?? "Unknown error");

      setTags(data.tags);
      return { tags: data.tags };
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyzeOutfit, loading, error, tags };
}
