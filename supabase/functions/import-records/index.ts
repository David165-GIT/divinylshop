import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Verify admin role
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Not admin" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { records } = await req.json();
    if (!Array.isArray(records) || records.length === 0) {
      return new Response(JSON.stringify({ error: "No records provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { index: number; title: string; artist: string; status: string; error?: string }[] = [];
    const validCategories = ["vinyl", "cd", "hifi", "editions_originales"];

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      try {
        const title = (r.titre || r.title || "").trim();
        const artist = (r.artiste || r.artist || "").trim();
        if (!title || !artist) {
          results.push({ index: i, title, artist, status: "error", error: "Titre et artiste requis" });
          continue;
        }

        let category = (r.categorie || r.category || "vinyl").trim().toLowerCase();
        if (!validCategories.includes(category)) category = "vinyl";

        let genre = (r.genre || "").trim() || null;
        const price = r.prix || r.price ? parseFloat(String(r.prix || r.price)) : null;
        const condition = (r.etat || r.condition || "").trim() || null;
        let description = (r.description || "").trim() || null;
        const quantity = r.quantite || r.quantity ? parseInt(String(r.quantite || r.quantity), 10) : 1;

        // Auto-generate genre if empty
        if (!genre && LOVABLE_API_KEY && category !== "hifi") {
          try {
            const genreResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-lite",
                messages: [
                  { role: "system", content: "Tu es un expert en musique. Donne uniquement le genre musical principal de cet album/single en un ou deux mots en français (ex: Rock, Jazz, Chanson française, Variété, Pop, Reggae, Soul, Funk, Classique, Électro, Hip-hop, Blues, R&B, Disco, Metal, Punk, Folk, Country, World). Réponds avec le genre uniquement, sans ponctuation ni explication." },
                  { role: "user", content: `"${title}" de ${artist}` },
                ],
              }),
            });
            if (genreResp.ok) {
              const genreData = await genreResp.json();
              const rawGenre = genreData.choices?.[0]?.message?.content?.trim();
              if (rawGenre && rawGenre.length < 50) genre = rawGenre;
            }
          } catch (e) { console.error("AI genre error:", e); }
        }

        // Auto-generate description if empty
        if (!description && LOVABLE_API_KEY && category !== "hifi") {
          try {
            const categoryLabel = category === "editions_originales" ? "édition originale (vinyle)" : category === "cd" ? "CD audio" : "disque vinyle";
            const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-lite",
                messages: [
                  { role: "system", content: `Tu es un expert en musique. Donne une description concise et attrayante en français (2-3 phrases max) de ce ${categoryLabel}. Réponds avec la description uniquement, sans JSON.` },
                  { role: "user", content: `"${title}" de ${artist}` },
                ],
              }),
            });
            if (aiResp.ok) {
              const aiData = await aiResp.json();
              const raw = aiData.choices?.[0]?.message?.content?.trim();
              if (raw) description = raw;
            }
          } catch (e) { console.error("AI desc error:", e); }
        }

        // Search cover image via iTunes + MusicBrainz
        let imageUrl: string | null = null;
        if (category !== "hifi") {
          try {
            const query = encodeURIComponent(`${artist} ${title}`);
            const itunesResp = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&entity=album&limit=1`);
            if (itunesResp.ok) {
              const itunesData = await itunesResp.json();
              if (itunesData.results?.[0]?.artworkUrl100) {
                imageUrl = itunesData.results[0].artworkUrl100.replace("100x100bb", "600x600bb");
              }
            }
          } catch (e) { console.error("iTunes error:", e); }

          if (!imageUrl) {
            try {
              const mbQuery = encodeURIComponent(`release:${title} AND artist:${artist}`);
              const mbResp = await fetch(`https://musicbrainz.org/ws/2/release/?query=${mbQuery}&limit=1&fmt=json`, {
                headers: { "User-Agent": "DivinylShop/1.0 (contact@divinylshop.com)" },
              });
              if (mbResp.ok) {
                const mbData = await mbResp.json();
                const releaseId = mbData.releases?.[0]?.id;
                if (releaseId) {
                  const coverResp = await fetch(`https://coverartarchive.org/release/${releaseId}`, {
                    headers: { "User-Agent": "DivinylShop/1.0 (contact@divinylshop.com)" },
                  });
                  if (coverResp.ok) {
                    const coverData = await coverResp.json();
                    const front = coverData.images?.find((img: any) => img.front);
                    if (front) imageUrl = front.thumbnails?.large || front.image;
                  }
                }
              }
            } catch (e) { console.error("MusicBrainz error:", e); }
          }

          // Upload image to storage
          if (imageUrl) {
            try {
              const imgResp = await fetch(imageUrl);
              const blob = await imgResp.blob();
              const path = `${crypto.randomUUID()}.jpg`;
              const { error: uploadErr } = await supabase.storage.from("record-images").upload(path, blob, { contentType: "image/jpeg" });
              if (!uploadErr) {
                const { data: urlData } = supabase.storage.from("record-images").getPublicUrl(path);
                imageUrl = urlData.publicUrl;
              }
            } catch (e) { console.error("Image upload error:", e); imageUrl = null; }
          }
        }

        const { error: insertErr } = await supabase.from("records").insert({
          title, artist, category, genre, price, condition, description,
          image_url: imageUrl, quantity, is_sold: quantity === 0,
        });

        if (insertErr) {
          results.push({ index: i, title, artist, status: "error", error: insertErr.message });
        } else {
          results.push({ index: i, title, artist, status: "ok" });
        }
      } catch (e) {
        results.push({ index: i, title: r.titre || r.title || "", artist: r.artiste || r.artist || "", status: "error", error: e instanceof Error ? e.message : "Unknown error" });
      }
    }

    const success = results.filter(r => r.status === "ok").length;
    const errors = results.filter(r => r.status === "error").length;

    return new Response(JSON.stringify({ success, errors, total: records.length, details: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("import-records error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
