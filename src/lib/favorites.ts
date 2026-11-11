import { useSyncExternalStore } from "react";

export type FavoriteItem = {
  id: string;
  title: string;
  artist: string;
  image_url: string | null;
  category: string;
};

const KEY = "divinyl_reperages_v1";
const listeners = new Set<() => void>();
let cache: FavoriteItem[] | null = null;

function read(): FavoriteItem[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(items: FavoriteItem[]) {
  cache = items;
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* quota */ }
  listeners.forEach((l) => l());
}

export function toggleFavorite(item: FavoriteItem) {
  const items = read();
  write(items.some((i) => i.id === item.id) ? items.filter((i) => i.id !== item.id) : [item, ...items]);
}

export function removeFavorite(id: string) {
  write(read().filter((i) => i.id !== id));
}

export function clearFavorites() {
  write([]);
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; l(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}

export function useFavorites() {
  return useSyncExternalStore(subscribe, read, () => []);
}
