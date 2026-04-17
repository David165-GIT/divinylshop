/**
 * Convertit une image (File ou Blob) au format WebP côté client via Canvas.
 * Redimensionne à max 800px (côté max) pour optimiser la bande passante.
 */
export async function convertToWebp(
  source: File | Blob,
  quality = 0.85,
  maxSize = 800
): Promise<Blob> {
  const bitmap = await createImageBitmap(source);
  const ratio = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("WebP conversion failed"))),
      "image/webp",
      quality
    );
  });
}
