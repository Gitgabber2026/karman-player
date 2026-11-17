"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import { useFavorites, type FavKind } from "@/lib/favorites";
import { AtlasMap, type MapContinent, type MapCountry, type MapLabels } from "@/components/map/atlas-map";
import type { MapFeature } from "@/lib/atlas";

const HREF: Record<string, string> = { venue: "clubs", festival: "festivals", artist: "artists", city: "cities", event: "events" };

export function MyWorld({ locale, features, countries, continents, labels, text }: {
  locale: "ru" | "en"; features: MapFeature[]; countries: MapCountry[]; continents: MapContinent[]; labels: MapLabels;
  text: { favorites: string; visited: string; saved: string; empty: string; map: string; clear: string; note: string; kinds: Record<string, string> };
}) {
  const { items, toggle, clear, ready } = useFavorites();
  const mine = useMemo(() => {
    const keys = new Set(items.map((i) => `${i.entity}:${i.slug}`));
    return features.filter((f) => keys.has(`${f.properties.kind}:${f.properties.slug}`));
  }, [items, features]);
  const groups: [FavKind, string][] = [["favorite", text.favorites], ["visited", text.visited], ["saved", text.saved]];
  if (!ready) return null;
  return (
    <div className="space-y-12">
      <p className="text-sm text-ink-3">{text.note}</p>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-2 p-8 text-center text-ink-2">{text.empty}</div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            {groups.map(([k, label]) => {
              const list = items.filter((i) => i.kind === k);
              return (
                <section key={k} className="rounded-2xl border border-line bg-card p-5">
                  <h2 className="mb-3 flex items-baseline justify-between font-display text-lg font-semibold">{label}<span className="font-mono text-xs text-ink-3">{list.length}</span></h2>
                  <ul className="space-y-1.5">
                    {list.map((i) => (
                      <li key={i.entity + i.slug} className="flex items-center justify-between gap-2">
                        <Link href={`/${locale}/${HREF[i.entity] ?? i.entity}/${i.slug}`} className="min-w-0 truncate text-sm hover:text-cyan">{i.title} <span className="text-xs text-ink-3">· {text.kinds[i.entity] ?? i.entity}</span></Link>
                        <button onClick={() => toggle(k, i.entity, i.slug, i.title)} aria-label="remove" className="text-ink-3 hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
          <section>
            <h2 className="mb-4 font-display text-xl font-semibold">{text.map}</h2>
            <div className="h-[480px] overflow-hidden rounded-2xl border border-line">
              <AtlasMap mode="city" features={mine} countries={countries} continents={continents} labels={labels} locale={locale} initialView={{ center: [10, 30], zoom: 1.4 }} className="h-full w-full" />
            </div>
          </section>
          <button onClick={() => { if (confirm(text.clear + "?")) clear(); }} className="text-sm text-ink-3 hover:text-danger">{text.clear}</button>
        </>
      )}
    </div>
  );
}
