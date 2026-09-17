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
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: `Tu es un expert en musique et en discographie. On te donne un nom d'artiste et un titre d'album/single. Vérifie trois choses :
1. Les fautes d'orthographe dans le nom d'artiste et le titre.
2. Le FORMAT du nom d'artiste est OBLIGATOIRE : toujours en MAJUSCULES, au format "PRENOM NOM" pour une personne (ex: "JOHNNY HALLYDAY", "SERGE GAINSBOURG") ou le nom du groupe en majuscules (ex: "THE BEATLES", "PINK FLOYD"). Corrige aussi l'ordre prénom/nom si nécessaire (ex: "Hallyday Johnny" -> "JOHNNY HALLYDAY"). Si le nom saisi n'est pas exactement sous ce format majuscules, propose la correction même si l'orthographe est bonne.
3. Le TITRE de l'album/single : retrouve le titre OFFICIEL exact de cette sortie dans la discographie de l'artiste, puis compare mot à mot avec le titre saisi. Corrige tout écart : orthographe, singulier/pluriel (ex: "Photos de Voyage" -> "Photos de voyages" pour FRANCIS CABREL), accents, apostrophes, mots manquants ou en trop, et majuscules. Respecte la graphie officielle réelle de l'album (ne force pas une majuscule à chaque mot si le titre officiel n'en a pas). Si tu n'es pas sûr du titre officiel, retourne null pour le titre.
Réponds UNIQUEMENT en JSON valide sans markdown ni backticks. Format: {"correctedArtist": "nom corrigé ou null si déjà au bon format et correct", "correctedTitle": "titre corrigé ou null si correct"}. Si les deux sont corrects, retourne {"correctedArtist": null, "correctedTitle": null}.` },
              { role: "user", content: `Artiste: "${artist}"\nTitre: "${title}"` },
            ],
          }),
        });
        const upper = (s: string) => s.toLocaleUpperCase("fr-FR");
        if (aiResp.ok) {
          const aiData = await aiResp.json();
          let raw = aiData.choices?.[0]?.message?.content?.trim() || "";
          raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
          try {
            const parsed = JSON.parse(raw);
            // Le nom d'artiste est TOUJOURS forcé en majuscules
            const artistCandidate = upper((parsed.correctedArtist || artist).trim());
            return {
              correctedArtist: artistCandidate !== artist ? artistCandidate : null,
              correctedTitle: parsed.correctedTitle && parsed.correctedTitle !== title ? parsed.correctedTitle : null,
            };
          } catch {
            const artistCandidate = upper(artist.trim());
            return { correctedArtist: artistCandidate !== artist ? artistCandidate : null, correctedTitle: null };
          }
        }
        const artistCandidate = upper(artist.trim());
        return { correctedArtist: artistCandidate !== artist ? artistCandidate : null, correctedTitle: null };
      } catch (e) {
        console.error("Spelling check error:", e);
        const fallback = artist.toLocaleUpperCase("fr-FR").trim();
        return { correctedArtist: fallback !== artist ? fallback : null, correctedTitle: null };
      }

    })();

    // Run image search, description generation, and genre detection in parallel
    // Search iTunes for cover art
    const itunesPromise = (async (): Promise<string[]> => {
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
                if (urls.length >= 5) break;
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

    // Search MusicBrainz + Cover Art Archive for cover art
    const musicBrainzPromise = (async (): Promise<string[]> => {
      if (!needsImage || category === "hifi") return [];
      try {
        const query = encodeURIComponent(`release:${title} AND artist:${artist}`);
        const resp = await fetch(`https://musicbrainz.org/ws/2/release/?query=${query}&limit=5&fmt=json`, {
          headers: { "User-Agent": "DivinylShop/1.0 (contact@divinylshop.com)" },
        });
        if (!resp.ok) return [];
        const data = await resp.json();
        const urls: string[] = [];
        if (data.releases) {
          for (const release of data.releases) {
            try {
              const coverResp = await fetch(`https://coverartarchive.org/release/${release.id}`, {
                headers: { "User-Agent": "DivinylShop/1.0 (contact@divinylshop.com)" },
              });
              if (coverResp.ok) {
                const coverData = await coverResp.json();
                const front = coverData.images?.find((img: any) => img.front);
                if (front?.thumbnails?.large || front?.image) {
                  urls.push(front.thumbnails?.large || front.image);
                  if (urls.length >= 3) break;
                }
              }
            } catch { /* skip this release */ }
          }
        }
        return urls;
      } catch (e) {
        console.error("MusicBrainz search error:", e);
        return [];
      }
    })();

    // Combine results from all sources, deduplicate
    const imagePromise = (async (): Promise<string[]> => {
      const [itunesUrls, mbUrls] = await Promise.all([itunesPromise, musicBrainzPromise]);
      const seen = new Set<string>();
      const combined: string[] = [];
      // Interleave: iTunes first, then MusicBrainz extras
      for (const url of [...itunesUrls, ...mbUrls]) {
        if (!seen.has(url)) {
          seen.add(url);
          combined.push(url);
          if (combined.length >= 5) break;
        }
      }
      return combined;
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
        console.error("AI desc/genre failed:", aiResp.status, (await aiResp.text()).slice(0, 300));
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
