"use client";
import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import type { MediaAsset } from "@/lib/types";

/**
 * Фотогалерея с полноэкранным просмотром. Каждое изображение показывается
 * с автором, лицензией и источником; без разрешённых материалов — честный пустой статус.
 */
export function Gallery({ media, locale, title, emptyLabel }: { media: MediaAsset[]; locale: "ru" | "en"; title: string; emptyLabel: string }) {
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % media.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + media.length) % media.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, media.length]);
  const L = (x: { ru: string; en?: string } | undefined) => (x ? (locale === "en" ? x.en ?? x.ru : x.ru) : "");
  return (
    <section>
      <h2 className="mb-4 font-display text-xl font-semibold">{title}</h2>
      {media.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line-2 p-5 text-sm text-ink-3"><ImageOff className="h-5 w-5" aria-hidden />{emptyLabel}</div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {media.map((m, i) => (
            <li key={m.id}>
              <button onClick={() => setOpen(i)} className="group block w-full overflow-hidden rounded-xl border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.thumbUrl ?? m.url} alt={L(m.alt)} loading="lazy" width={m.width} height={m.height} className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105" />
              </button>
              <p className="mt-1 text-[11px] text-ink-3">© {m.author} · {m.license}</p>
            </li>
          ))}
        </ul>
      )}
      {open !== null && media[open] && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col bg-bg/95 backdrop-blur" onClick={() => setOpen(null)}>
          <div className="flex justify-end p-4"><button aria-label="close" className="grid h-10 w-10 place-items-center rounded-full border border-line-2"><X className="h-5 w-5" /></button></div>
          <div className="relative flex flex-1 items-center justify-center px-4" onClick={(e) => e.stopPropagation()}>
            <button aria-label="previous" onClick={() => setOpen((open - 1 + media.length) % media.length)} className="absolute left-4 grid h-10 w-10 place-items-center rounded-full border border-line-2 bg-bg"><ChevronLeft /></button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={media[open].url} alt={L(media[open].alt)} className="max-h-[75vh] max-w-full rounded-lg object-contain" />
            <button aria-label="next" onClick={() => setOpen((open + 1) % media.length)} className="absolute right-4 grid h-10 w-10 place-items-center rounded-full border border-line-2 bg-bg"><ChevronRight /></button>
          </div>
          <div className="p-6 text-center text-sm text-ink-2" onClick={(e) => e.stopPropagation()}>
            {L(media[open].caption)}
            <div className="mt-1 text-xs text-ink-3">
              © {media[open].author} · <a href={media[open].licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">{media[open].license}</a> · <a href={media[open].sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">source</a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
