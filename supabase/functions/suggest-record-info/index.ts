import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, artist, category, needsImage = true, needsDescription = true, needsGenre = false } = await req.json();
    if (!title || !artist) {
      return new Response(JSON.stringify({ error: "title and artist are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Run image search, description generation, and genre detection in parallel
    const imagePromise = (async (): Promise<string | null> => {
      if (!needsImage || category === "hifi") return null;
      try {
        const query = encodeURIComponent(`${artist} ${title}`);
        const resp = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&entity=album&limit=5`);
        if (!resp.ok) return null;
        const data = await resp.json();
        if (data.results && data.results.length > 0) {
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

    const descAndGenrePromise = (async (): Promise<{ description: string | null; genre: string | null }> => {
      if (!needsDescription && !needsGenre) return { description: null, genre: null };
      try {
        const categoryLabel = category === "hifi" ? "matériel Hi-Fi" : category === "editions_originales" ? "édition originale (vynil)" : "disque vinyle";
        
        let systemPrompt: string;
        let userPrompt: string;

        if (needsDescription && needsGenre) {
          systemPrompt = `Tu es un expert en musique et en ${categoryLabel}. Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks. Format: {"description": "...", "genre": "..."}. La description doit être concise et attrayante en français (2-3 phrases max). Le genre doit être un seul mot ou expression courte en français (ex: Rock, Jazz, Pop, Funk, Soul, Classique, Chanson française, Variété, Reggae, Blues, Electro, Hip-Hop, Metal, Punk, Country, R&B, Disco, New Wave, Progressif, Hard Rock).`;
          userPrompt = `Donne la description et le genre musical de : "${title}" de ${artist}. Catégorie : ${categoryLabel}.`;
        } else if (needsGenre) {
          systemPrompt = `Tu es un expert en musique. Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks. Format: {"genre": "..."}. Le genre doit être un seul mot ou expression courte en français (ex: Rock, Jazz, Pop, Funk, Soul, Classique, Chanson française, Variété, Reggae, Blues, Electro, Hip-Hop, Metal, Punk, Country, R&B, Disco, New Wave, Progressif, Hard Rock).`;
          userPrompt = `Quel est le genre musical de : "${title}" de ${artist} ?`;
        } else {
          systemPrompt = `Tu es un expert en musique et en ${categoryLabel}. Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks. Format: {"description": "..."}. La description doit être concise et attrayante en français (2-3 phrases max).`;
          userPrompt = `Décris cet article : "${title}" de ${artist}. Catégorie : ${categoryLabel}.`;
        }

        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          const raw = aiData.choices?.[0]?.message?.content?.trim() || "";
          try {
            const parsed = JSON.parse(raw);
            return {
              description: needsDescription ? (parsed.description || null) : null,
              genre: needsGenre ? (parsed.genre || null) : null,
            };
          } catch {
            // Fallback: if not JSON, treat as description only
            return {
              description: needsDescription ? raw : null,
              genre: null,
            };
          }
        }
        if (aiResp.status === 429) console.warn("AI rate limited");
        return { description: null, genre: null };
      } catch (e) {
        console.error("AI error:", e);
        return { description: null, genre: null };
      }
    })();

    const [imageUrl, { description, genre }] = await Promise.all([imagePromise, descAndGenrePromise]);

    console.log("Result:", { imageUrl: imageUrl ? "found" : "not found", description: description ? "generated" : "not generated", genre: genre || "not found" });

    return new Response(JSON.stringify({ imageUrl, description, genre }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-record-info error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
