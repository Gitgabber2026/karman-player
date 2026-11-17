"use client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import type { SearchResult } from "@/lib/atlas";
import type { Locale } from "@/lib/types";
import { cn } from "@/lib/utils";

function useDebounced<T>(v: T, ms: number) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

export function GlobalSearch({ locale, placeholder, kindLabels, nothing, className, autoFocus }: {
  locale: Locale; placeholder: string; kindLabels: Record<string, string>; nothing: string; className?: string; autoFocus?: boolean;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const dq = useDebounced(q.trim(), 180);
  const router = useRouter();
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const { data, isFetching } = useQuery({
    queryKey: ["search", locale, dq],
    enabled: dq.length >= 2,
    queryFn: async () => {
      const r = await fetch(`/api/search?q=${encodeURIComponent(dq)}&locale=${locale}&limit=8`);
      if (!r.ok) throw new Error("search failed");
      return (await r.json()).results as SearchResult[];
    },
  });
  const results = dq.length >= 2 ? data ?? [] : [];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const go = (href: string) => { setOpen(false); setQ(""); router.push(href); };

  return (
    <div ref={box} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (results[active]) go(results[active].href);
          else if (q.trim()) go(`/${locale}/search?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        <label className="flex h-10 items-center gap-2 rounded-full border border-line bg-bg-2/80 px-3 text-sm focus-within:border-cyan">
          <Search className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
          <input
            value={q}
            autoFocus={autoFocus}
            onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={open && results.length > 0}
            role="combobox"
            className="w-full min-w-0 bg-transparent text-ink placeholder:text-ink-3 focus:outline-none"
          />
          {isFetching && <Loader2 className="h-4 w-4 animate-spin text-ink-3" aria-hidden />}
        </label>
      </form>
      {open && dq.length >= 2 && (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 top-12 z-50 max-h-96 overflow-auto rounded-2xl border border-line-2 bg-card p-1.5 shadow-2xl scrollbar-thin">
          {results.length === 0 && !isFetching && <li className="px-3 py-2 text-sm text-ink-3">{nothing}</li>}
          {results.map((r, i) => (
            <li key={r.kind + r.slug} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.href)}
                className={cn("flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left", i === active && "bg-bg-2")}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink">{r.title}</span>
                  {r.subtitle && <span className="block truncate text-xs text-ink-3">{r.subtitle}</span>}
                </span>
                <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-2">{kindLabels[r.kind] ?? r.kind}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
