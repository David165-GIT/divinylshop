import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, artist, category, needsImage = true, needsDescription = true } = await req.json();
    if (!title || !artist) {
      return new Response(JSON.stringify({ error: "title and artist are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Run image search and description generation in parallel
    const imagePromise = (async (): Promise<string | null> => {
      if (category === "hifi") return null;
      try {
        // Use iTunes Search API - fast and reliable for album art
        const query = encodeURIComponent(`${artist} ${title}`);
        const resp = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&entity=album&limit=5`);
        if (!resp.ok) return null;
        const data = await resp.json();
        if (data.results && data.results.length > 0) {
          // Get the highest resolution artwork (replace 100x100 with 600x600)
          const artwork = data.results[0].artworkUrl100;
          if (artwork) {
            return artwork.replace("100x100bb", "600x600bb");
          }
        }
      } catch (e) {
        console.error("iTunes search error:", e);
      }
      return null;
    })();

    const descPromise = (async (): Promise<string | null> => {
      try {
        const categoryLabel = category === "hifi" ? "matériel Hi-Fi" : category === "editions_originales" ? "édition originale (vinyle)" : "disque vinyle";
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: `Tu es un expert en musique et en ${categoryLabel}. Génère une description concise et attrayante en français (2-3 phrases max) pour un article de disquaire. Ne mets pas de guillemets autour de la réponse.`,
              },
              {
                role: "user",
                content: `Décris cet article : "${title}" de ${artist}. Catégorie : ${categoryLabel}.`,
              },
            ],
          }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          return aiData.choices?.[0]?.message?.content?.trim() || null;
        }
        if (aiResp.status === 429) console.warn("AI rate limited");
        return null;
      } catch (e) {
        console.error("AI description error:", e);
        return null;
      }
    })();

    const [imageUrl, description] = await Promise.all([imagePromise, descPromise]);

    console.log("Result:", { imageUrl: imageUrl ? "found" : "not found", description: description ? "generated" : "not generated" });

    return new Response(JSON.stringify({ imageUrl, description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-record-info error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
