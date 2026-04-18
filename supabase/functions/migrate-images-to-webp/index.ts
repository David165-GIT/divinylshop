import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "record-images";
const MAX_SIZE = 800;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Vérification admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(Number(body.batchSize) || 20, 50);

    // Récupérer un lot d'enregistrements à convertir
    const { data: records, error: fetchErr } = await supabase
      .from("records")
      .select("id, image_url")
      .not("image_url", "is", null)
      .not("image_url", "ilike", "%.webp")
      .limit(batchSize);

    if (fetchErr) throw fetchErr;
    if (!records || records.length === 0) {
      return new Response(
        JSON.stringify({ done: true, processed: 0, remaining: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results: { id: string; status: string; error?: string }[] = [];

    for (const rec of records) {
      try {
        const url = rec.image_url as string;
        // Extraire le path depuis l'URL publique
        const marker = `/${BUCKET}/`;
        const idx = url.indexOf(marker);
        if (idx === -1) throw new Error("URL non reconnue");
        const oldPath = url.substring(idx + marker.length);

        // Télécharger
        const { data: blob, error: dlErr } = await supabase.storage
          .from(BUCKET)
          .download(oldPath);
        if (dlErr || !blob) throw dlErr || new Error("Téléchargement échoué");

        const buf = new Uint8Array(await blob.arrayBuffer());
        const img = await Image.decode(buf);
        const ratio = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
        if (ratio < 1) {
          img.resize(
            Math.round(img.width * ratio),
            Math.round(img.height * ratio)
          );
        }
        const webp = await img.encode(); // imagescript encode = PNG par défaut
        // imagescript ne supporte pas WebP nativement => utiliser encodeJPEG ? On préfère WebP
        // Alternative : utiliser encodeWEBP via wasm. Imagescript >=1.2.15 supporte encodeWEBP.
        // Si non disponible, fallback JPEG
        let outBytes: Uint8Array;
        let contentType = "image/webp";
        let ext = "webp";
        // @ts-ignore
        if (typeof img.encodeWEBP === "function") {
          // @ts-ignore
          outBytes = await img.encodeWEBP(85);
        } else {
          outBytes = await img.encodeJPEG(85);
          contentType = "image/jpeg";
          ext = "jpg";
        }

        // Nouveau path
        const baseName = oldPath.replace(/\.[^.]+$/, "");
        const newPath = `${baseName}.${ext}`;

        // Upload
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(newPath, outBytes, {
            contentType,
            upsert: true,
          });
        if (upErr) throw upErr;

        // URL publique
        const { data: pub } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(newPath);

        // Mettre à jour le record
        const { error: updErr } = await supabase
          .from("records")
          .update({ image_url: pub.publicUrl })
          .eq("id", rec.id);
        if (updErr) throw updErr;

        // Supprimer l'ancien fichier si différent
        if (oldPath !== newPath) {
          await supabase.storage.from(BUCKET).remove([oldPath]);
        }

        results.push({ id: rec.id, status: "ok" });
      } catch (e) {
        results.push({
          id: rec.id,
          status: "error",
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    // Compter le restant
    const { count } = await supabase
      .from("records")
      .select("id", { count: "exact", head: true })
      .not("image_url", "is", null)
      .not("image_url", "ilike", "%.webp");

    return new Response(
      JSON.stringify({
        processed: results.length,
        remaining: count ?? 0,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
