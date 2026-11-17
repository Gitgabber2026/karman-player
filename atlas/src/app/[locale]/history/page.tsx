import Link from "next/link";
import { pageContext } from "@/lib/page";
import { tx, hrefFor } from "@/lib/atlas";
import { mapProps } from "@/lib/map-props";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { AtlasMap } from "@/components/map/atlas-map";
import { LinkChips } from "@/components/link-chips";
import { VerificationBadge } from "@/components/verification-badge";

export const dynamic = "force-dynamic";
export const metadata = { title: "История / History" };

export default async function History({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ year?: string }> }) {
  const { locale, t, atlas } = await pageContext(params);
  const { year } = await searchParams;
  const y = Math.min(2026, Math.max(1920, Number(year) || 1991));
  const mp = mapProps(atlas, locale, t);
  const eras = atlas.d.eras;
  return (
    <div>
      <div className="mx-auto max-w-[1440px] px-4 pt-12 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: t.map.world, href: `/${locale}` }, { label: t.nav.history }]} />
        <h1 className="mt-6 font-display text-4xl font-semibold sm:text-6xl">{t.sections.timeline}</h1>
        <p className="mt-4 max-w-3xl text-ink-2">{locale === "ru" ? "От первых электронных инструментов до глобальной клубной культуры. Историческая карта показывает только объекты, существование которых подтверждено для выбранного года." : "From the first electronic instruments to global club culture. The historical map shows only places confirmed to exist in the selected year."}</p>
      </div>

      {/* Навигация по эпохам */}
      <nav className="sticky top-16 z-30 mt-8 border-y border-line bg-bg/90 backdrop-blur" aria-label="eras">
        <ol className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-4 py-2 scrollbar-thin sm:px-6 lg:px-8">
          {eras.map((e) => (
            <li key={e.slug}><a href={`#${e.slug}`} className="block whitespace-nowrap rounded-full px-3 py-1.5 text-xs text-ink-2 hover:bg-card hover:text-ink"><span className="font-mono text-acid">{e.startYear}</span> {tx(e.name, locale)}</a></li>
          ))}
        </ol>
      </nav>

      <section className="mx-auto mt-10 max-w-[1440px] px-4 sm:px-6 lg:px-8" aria-label={t.map.historicalMode}>
        <h2 className="mb-4 font-display text-2xl font-semibold">{t.map.historicalMode}</h2>
        <div className="h-[560px] overflow-hidden rounded-2xl border border-line">
          <AtlasMap mode="full" historicalYear={y} features={atlas.mapFeatures(locale)} {...mp} className="h-full w-full" />
        </div>
      </section>

      <div className="mx-auto mt-16 max-w-5xl px-4 sm:px-6 lg:px-8">
        <ol className="relative border-l border-line-2">
          {eras.map((e) => {
            const ms = atlas.milestonesOfEra(e.slug);
            return (
              <li key={e.slug} id={e.slug} className="scroll-mt-32 pb-16 pl-8">
                <span className="absolute -left-[7px] mt-2 h-3.5 w-3.5 rounded-full border-2 border-bg bg-acid" />
                <div className="font-mono text-sm text-acid">{e.startYear} — {e.endYear}</div>
                <h3 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{tx(e.name, locale)}</h3>
                <p className="mt-2 text-lg text-ink">{tx(e.summary, locale)}</p>
                <p className="prose-atlas mt-4">{tx(e.context, locale)}</p>
                {ms.length > 0 && (
                  <ul className="mt-6 space-y-3">
                    {ms.map((m) => (
                      <li key={m.slug} className="rounded-xl border border-line bg-card p-4">
                        <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm text-cyan">{m.year}</span><span className="font-medium">{tx(m.title, locale)}</span>
                          {m.city && <Link href={hrefFor(locale, "city", m.city)} className="text-xs text-ink-3 hover:text-cyan">· {tx(atlas.city(m.city)?.name, locale)}</Link>}
                          <span className="ml-auto"><VerificationBadge status={m.verification} t={t} /></span></div>
                        <p className="mt-1 text-sm text-ink-2">{tx(m.summary, locale)}</p>
                        {m.sources.length > 0 && <div className="mt-2 text-xs text-ink-3">{atlas.sourcesOf(m.sources).map((s) => <a key={s.id} href={s.source.url} target="_blank" rel="noopener noreferrer" className="mr-3 hover:text-cyan">↗ {s.source.title}</a>)}</div>}
                        <Link href={`/${locale}/history?year=${m.year}#map`} className="mt-2 inline-block text-xs text-acid hover:underline">{t.map.historicalMode}: {m.year} →</Link>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {e.cities.length > 0 && <div><div className="mb-2 text-xs uppercase tracking-widest text-ink-3">{t.common.cities}</div><LinkChips items={e.cities.map((c) => ({ href: hrefFor(locale, "city", c), label: tx(atlas.city(c)?.name, locale) }))} /></div>}
                  {e.genres.length > 0 && <div><div className="mb-2 text-xs uppercase tracking-widest text-ink-3">{t.common.genres}</div><LinkChips items={e.genres.map((g) => ({ href: hrefFor(locale, "genre", g), label: tx(atlas.genre(g)?.name, locale) }))} /></div>}
                  {e.artists.length > 0 && <div><div className="mb-2 text-xs uppercase tracking-widest text-ink-3">{t.common.artists}</div><LinkChips items={e.artists.map((a) => ({ href: hrefFor(locale, "artist", a), label: tx(atlas.artist(a)?.name, locale) }))} /></div>}
                  {e.venues.length > 0 && <div><div className="mb-2 text-xs uppercase tracking-widest text-ink-3">{t.common.clubs}</div><LinkChips items={e.venues.map((v) => ({ href: hrefFor(locale, "venue", v), label: tx(atlas.venue(v)?.name, locale) }))} /></div>}
                </div>
                {e.releases.length > 0 && (
                  <div className="mt-6"><div className="mb-2 text-xs uppercase tracking-widest text-ink-3">{t.common.releases}</div>
                    <ul className="space-y-1 text-sm">{e.releases.map((r) => <li key={r.title}><span className="font-mono text-cyan">{r.year}</span> · {r.artist} — <i>{r.title}</i></li>)}</ul></div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
