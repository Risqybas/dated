// src/hooks/useRemoveBg.js
// Usage in OutfitDetail.jsx:
//
//   const { removeBg, loading, error } = useRemoveBg();
//   await removeBg(outfit.id, outfit.image_url);

import { useState } from "react";
import { supabase } from "../lib/supabase";

export function useRemoveBg() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  async function removeBg(outfitId, imageUrl) {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnErr } = await supabase.functions.invoke("remove-bg", {
        body: { outfit_id: outfitId, image_url: imageUrl },
      });

      if (fnErr) throw fnErr;

      return data; // { success, outfit_id, processed_image_url }
    } catch (err) {
      const msg = err?.message ?? "Background removal failed";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { removeBg, loading, error };
}
