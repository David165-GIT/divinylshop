import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import decodeJpeg, { init as initJpegDec } from "https://esm.sh/@jsquash/jpeg@1.4.0/decode";
import decodePng, { init as initPngDec } from "https://esm.sh/@jsquash/png@3.0.0/decode";
import encodeWebp, { init as initWebpEnc } from "https://esm.sh/@jsquash/webp@1.4.0/encode";
import resize, { initResize } from "https://esm.sh/@jsquash/resize@2.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "record-images";
const MAX_SIZE = 800;

async function fetchWasm(url: string): Promise<WebAssembly.Module> {
  const res = await fetch(url);
  const bytes = await res.arrayBuffer();
  return await WebAssembly.compile(bytes);
}

let initialized = false;
async function ensureInit() {
  if (initialized) return;
  // Charger les modules wasm explicitement (Deno edge runtime ne sait pas faire le fetch implicite)
  const [jpegMod, pngMod, webpMod, resizeMod] = await Promise.all([
    fetchWasm("https://esm.sh/@jsquash/jpeg@1.4.0/codec/dec/mozjpeg_dec.wasm"),
    fetchWasm("https://esm.sh/@jsquash/png@3.0.0/codec/squoosh_png_bg.wasm"),
    fetchWasm("https://esm.sh/@jsquash/webp@1.4.0/codec/enc/webp_enc_simd.wasm"),
    fetchWasm("https://esm.sh/@jsquash/resize@2.1.0/lib/resize/squoosh_resize_bg.wasm"),
  ]);
  await Promise.all([
    initJpegDec(jpegMod),
    initPngDec(pngMod),
    initWebpEnc(webpMod),
    initResize(resizeMod),
  ]);
  initialized = true;
}

async function convertToWebp(bytes: Uint8Array, mimeHint: string): Promise<Uint8Array> {
  await ensureInit();
  let imgData: ImageData;
  if (mimeHint.includes("png")) {
    imgData = await decodePng(bytes);
  } else {
    imgData = await decodeJpeg(bytes);
  }
  const ratio = Math.min(1, MAX_SIZE / Math.max(imgData.width, imgData.height));
  if (ratio < 1) {
    const w = Math.round(imgData.width * ratio);
    const h = Math.round(imgData.height * ratio);
    imgData = await resize(imgData, { width: w, height: h });
  }
  return await encodeWebp(imgData, { quality: 82 });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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
    const batchSize = Math.min(Number(body.batchSize) || 3, 5);
    console.log(`[migrate-webp] start batch size=${batchSize}`);

    const { data: records, error: fetchErr } = await supabase
      .from("records")
      .select("id, image_url")
      .not("image_url", "is", null)
      .not("image_url", "ilike", "%.webp")
      .limit(batchSize);
    console.log(`[migrate-webp] fetched ${records?.length ?? 0} records`);

    if (fetchErr) throw fetchErr;
    if (!records || records.length === 0) {
      return new Response(
        JSON.stringify({ done: true, processed: 0, remaining: 0, results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { id: string; status: string; error?: string }[] = [];

    for (const rec of records) {
      try {
        const url = rec.image_url as string;
        const marker = `/${BUCKET}/`;
        const idx = url.indexOf(marker);
        if (idx === -1) throw new Error("URL non reconnue");
        const oldPath = url.substring(idx + marker.length);

        const { data: blob, error: dlErr } = await supabase.storage
          .from(BUCKET)
          .download(oldPath);
        if (dlErr || !blob) throw dlErr || new Error("Téléchargement échoué");

        const inputBytes = new Uint8Array(await blob.arrayBuffer());
        const mimeHint = blob.type || (oldPath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");
        const webpBytes = await convertToWebp(inputBytes, mimeHint);

        const baseName = oldPath.replace(/\.[^.]+$/, "");
        const newPath = `${baseName}.webp`;

        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(newPath, webpBytes, {
            contentType: "image/webp",
            upsert: true,
          });
        if (upErr) throw upErr;

        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(newPath);

        const { error: updErr } = await supabase
          .from("records")
          .update({ image_url: pub.publicUrl })
          .eq("id", rec.id);
        if (updErr) throw updErr;

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
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
