import type { SyntheticEvent } from "react";

/** Retries a failed image load up to 3 times with increasing delay. */
export const retryImage = (e: SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  const tries = Number(img.dataset.retry || "0");
  if (tries >= 3) return;
  img.dataset.retry = String(tries + 1);
  const base = img.src.split("?")[0];
  setTimeout(() => {
    img.src = `${base}?r=${tries + 1}`;
  }, 800 * (tries + 1));
};
