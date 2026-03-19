import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, artist, category } = await req.json();
    if (!title || !artist) {
      return new Response(JSON.stringify({ error: "title and artist are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // 1. Search MusicBrainz for cover art (vinyl/editions_originales)
    let imageUrl: string | null = null;
    if (category !== "hifi") {
      try {
        const mbQuery = encodeURIComponent(`release:"${title}" AND artist:"${artist}"`);
        const mbResp = await fetch(
          `https://musicbrainz.org/ws/2/release/?query=${mbQuery}&fmt=json&limit=5`,
          { headers: { "User-Agent": "Divinyl/1.0 (contact@divinyl.fr)" } }
        );
        if (mbResp.ok) {
          const mbData = await mbResp.json();
          const releases = mbData.releases || [];
          for (const release of releases) {
            try {
              const coverResp = await fetch(
                `https://coverartarchive.org/release/${release.id}/front-500`,
                { redirect: "follow" }
              );
              if (coverResp.ok) {
                imageUrl = coverResp.url;
                break;
              }
            } catch { /* try next release */ }
          }
        }
      } catch (e) {
        console.error("MusicBrainz search error:", e);
      }
    }

    // 2. Generate description with Lovable AI
    let description: string | null = null;
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
        description = aiData.choices?.[0]?.message?.content?.trim() || null;
      } else if (aiResp.status === 429) {
        console.warn("AI rate limited");
      }
    } catch (e) {
      console.error("AI description error:", e);
    }

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
