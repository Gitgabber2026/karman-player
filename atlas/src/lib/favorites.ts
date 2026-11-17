"use client";
import { useCallback, useEffect, useState } from "react";

export type FavKind = "favorite" | "visited" | "saved";
export interface FavItem { kind: FavKind; entity: string; slug: string; title: string; at: string }

const KEY = "emwa:my-world:v1";
const EVT = "emwa:favorites";

function read(): FavItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function write(items: FavItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* хранилище недоступно (приватный режим) — состояние живёт до перезагрузки */
  }
  window.dispatchEvent(new Event(EVT));
}

/**
 * «Мой электронный мир» — локальное хранение в браузере.
 * Синхронизация с аккаунтом (таблицы users/favorites) — следующий этап.
 */
export function useFavorites() {
  const [items, setItems] = useState<FavItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    setReady(true);
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const has = useCallback((k: FavKind, e: string, s: string) => items.some((i) => i.kind === k && i.entity === e && i.slug === s), [items]);
  const toggle = useCallback((k: FavKind, e: string, s: string, title: string) => {
    const cur = read();
    const exists = cur.some((i) => i.kind === k && i.entity === e && i.slug === s);
    write(exists ? cur.filter((i) => !(i.kind === k && i.entity === e && i.slug === s)) : [...cur, { kind: k, entity: e, slug: s, title, at: new Date().toISOString() }]);
  }, []);
  const clear = useCallback(() => write([]), []);
  return { items, has, toggle, clear, ready };
}
