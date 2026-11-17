import Link from "next/link";
import { pageContext } from "@/lib/page";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FilterForm } from "@/components/filter-form";
import type { SearchKind } from "@/lib/atlas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Поиск / Search" };

const KINDS: SearchKind[] = ["country", "city", "venue", "festival", "artist", "genre", "label", "event"];

export default async function SearchPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; kind?: string }> }) {
  const { locale, t, atlas } = await pageContext(params);
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 100);
  const kind = KINDS.includes(sp.kind as SearchKind) ? (sp.kind as SearchKind) : undefined;
  const results = q ? atlas.search(q, locale, { limit: 60, kinds: kind ? [kind] : undefined }) : [];
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t.map.world, href: `/${locale}` }, { label: t.nav.search }]} />
      <h1 className="mt-6 font-display text-4xl font-semibold sm:text-5xl">{t.nav.search}</h1>
      <p className="mt-3 text-sm text-ink-2">{locale === "ru" ? "Поиск понимает частичные совпадения, разные написания и транслитерацию: «бергхайн», «трезор», «карл кокс», «детройт»." : "Partial matches, alternative spellings and transliteration are supported."}</p>
      <div className="mt-6">
        <FilterForm applyLabel={t.nav.search} resetLabel={t.common.reset} fields={[
          { name: "q", label: t.map.searchPlaceholder, type: "search", value: q },
          { name: "kind", label: t.common.type, type: "select", value: kind, options: [{ value: "", label: t.common.all }, ...KINDS.map((k) => ({ value: k, label: t.kinds[k] }))] },
        ]} />
      </div>
      {q && <p className="mt-6 font-mono text-xs text-ink-3">{t.common.results}: {results.length}</p>}
      {q && results.length === 0 && <p className="mt-4 text-ink-2">{t.common.nothing}</p>}
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line empty:hidden">
        {results.map((r) => (
          <li key={r.kind + r.slug}><Link href={r.href} className="flex items-center justify-between gap-4 p-4 hover:bg-card">
            <span><span className="block font-medium">{r.title}</span>{r.subtitle && <span className="block text-sm text-ink-3">{r.subtitle}</span>}</span>
            <span className="rounded-full border border-line px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-ink-2">{t.kinds[r.kind]}</span>
          </Link></li>
        ))}
      </ul>
    </div>
  );
}
