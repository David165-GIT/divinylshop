import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, artist, category, needsImage = true, needsDescription = true, needsGenre = false, checkSpelling = false } = await req.json();
    if (!title || !artist) {
      return new Response(JSON.stringify({ error: "title and artist are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Spelling check for artist and title names
    const spellingPromise = (async (): Promise<{ correctedArtist: string | null; correctedTitle: string | null }> => {
      if (!checkSpelling) return { correctedArtist: null, correctedTitle: null };
      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: `Tu es un expert en musique. On te donne un nom d'artiste et un titre d'album/single. Vérifie deux choses :
1. Les fautes d'orthographe dans le nom d'artiste et le titre.
2. La capitalisation du titre d'album : compare avec le titre officiel connu. En général les titres d'albums ont une majuscule au début de chaque mot significatif (ex: "Des Roses et des Orties", "Back In Black", "Abbey Road"). Si le titre saisi n'a pas les bonnes majuscules par rapport au titre officiel, propose la correction.
Réponds UNIQUEMENT en JSON valide sans markdown ni backticks. Format: {"correctedArtist": "nom corrigé ou null si correct", "correctedTitle": "titre corrigé ou null si correct"}. Si les deux sont corrects, retourne {"correctedArtist": null, "correctedTitle": null}.` },
              { role: "user", content: `Artiste: "${artist}"\nTitre: "${title}"` },
            ],
          }),
        });
        if (aiResp.ok) {
          const aiData = await aiResp.json();
          let raw = aiData.choices?.[0]?.message?.content?.trim() || "";
          raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
          try {
            const parsed = JSON.parse(raw);
            return {
              correctedArtist: parsed.correctedArtist && parsed.correctedArtist !== artist ? parsed.correctedArtist : null,
              correctedTitle: parsed.correctedTitle && parsed.correctedTitle !== title ? parsed.correctedTitle : null,
            };
          } catch { return { correctedArtist: null, correctedTitle: null }; }
        }
        return { correctedArtist: null, correctedTitle: null };
      } catch (e) {
        console.error("Spelling check error:", e);
        return { correctedArtist: null, correctedTitle: null };
      }
    })();

    // Run image search, description generation, and genre detection in parallel
    const imagePromise = (async (): Promise<string[]> => {
      if (!needsImage || category === "hifi") return [];
      try {
        const query = encodeURIComponent(`${artist} ${title}`);
        const resp = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&entity=album&limit=5`);
        if (!resp.ok) return [];
        const data = await resp.json();
        if (data.results && data.results.length > 0) {
          const urls: string[] = [];
          const seen = new Set<string>();
          for (const result of data.results) {
            const artwork = result.artworkUrl100;
            if (artwork) {
              const highRes = artwork.replace("100x100bb", "600x600bb");
              if (!seen.has(highRes)) {
                seen.add(highRes);
                urls.push(highRes);
                if (urls.length >= 3) break;
              }
            }
          }
          return urls;
        }
      } catch (e) {
        console.error("iTunes search error:", e);
      }
      return [];
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
          let raw = aiData.choices?.[0]?.message?.content?.trim() || "";
          // Strip markdown code fences if present
          raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
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

    const [imageUrls, { description, genre }, { correctedArtist, correctedTitle }] = await Promise.all([imagePromise, descAndGenrePromise, spellingPromise]);

    console.log("Result:", { imageUrls: imageUrls.length, description: description ? "generated" : "not generated", genre: genre || "not found", correctedArtist, correctedTitle });

    return new Response(JSON.stringify({ imageUrl: imageUrls[0] || null, imageUrls, description, genre, correctedArtist, correctedTitle }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-record-info error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
