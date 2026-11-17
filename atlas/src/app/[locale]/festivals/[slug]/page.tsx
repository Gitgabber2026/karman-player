import { notFound } from "next/navigation";
import { pageContext } from "@/lib/page";
import { tx, hrefFor } from "@/lib/atlas";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ArticleSections } from "@/components/article-sections";
import { SourcesList } from "@/components/sources-list";
import { MiniMap } from "@/components/mini-map";
import { KeyFacts } from "@/components/key-facts";
import { LinkChips } from "@/components/link-chips";
import { Badge } from "@/components/ui/badge";
import { Gallery } from "@/components/gallery";
import { FavoriteButton } from "@/components/favorite-button";
import { fmtCoord, safeUrl, fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug, locale } = await params;
  const { atlas } = await pageContext(params);
  const f = atlas.festival(slug);
  return f ? { title: tx(f.name, locale as "ru"), description: tx(f.summary, locale as "ru") } : {};
}

export default async function FestivalPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const { locale, t, atlas } = await pageContext(params);
  const f = atlas.festival(slug);
  if (!f) notFound();
  const city = atlas.city(f.city);
  const country = atlas.countryOfCity(f.city);
  const editions = atlas.editionsOf(f.slug);
  const artists = f.notableArtists.map((a) => atlas.artist(a)).filter((a): a is NonNullable<typeof a> => !!a);
  const site = safeUrl(f.website);
  const center: [number, number] = f.coords ? [f.coords.lng, f.coords.lat] : city ? [city.coords.lng, city.coords.lat] : [0, 0];
  const features = atlas.mapFeatures(locale).filter((x) => x.properties.city === f.city || x.properties.id === `festival:${f.slug}`);
  return (
    <>
      <PageHero
        kicker={<Breadcrumbs items={[{ label: tx(country?.name, locale), href: hrefFor(locale, "country", country?.slug ?? "") }, { label: tx(city?.name, locale), href: hrefFor(locale, "city", f.city) }, { label: t.nav.festivals, href: `/${locale}/festivals` }, { label: tx(f.name, locale) }]} />}
        title={tx(f.name, locale)} subtitle={tx(f.summary, locale)} seed={f.slug} kindLabel={t.festivalType[f.type]} placeholderLabel={t.common.placeholder}>
        <Badge tone="cyan">{t.festivalType[f.type]}</Badge>
        <Badge tone={f.status === "active" ? "acid" : "violet"}>{t.festivalStatus[f.status]}</Badge>
        <FavoriteButton entity="festival" slug={f.slug} title={tx(f.name, locale)} labels={{ favorite: t.common.favorite, favorited: t.common.favorited, visited: t.common.visited, saved: t.common.saved }} kinds={["favorite", "visited"]} />
      </PageHero>
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="min-w-0 space-y-12">
          {f.concept && <blockquote className="border-l-2 border-cyan pl-5 font-display text-xl leading-snug text-ink">{tx(f.concept, locale)}</blockquote>}
          <ArticleSections sections={f.sections} facts={f.facts} locale={locale} factsLabel={t.common.facts} />
          <section>
            <h2 className="mb-4 font-display text-xl font-semibold">{t.common.editions}</h2>
            {editions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-warn/40 bg-warn/5 p-5 text-sm text-warn">{t.common.noEditions}</div>
            ) : (
              <ul className="divide-y divide-line rounded-2xl border border-line">
                {editions.map((e) => (
                  <li key={e.year} className="flex flex-wrap items-center gap-3 p-4">
                    <span className="font-display text-xl">{e.year}</span>
                    <span className="text-sm text-ink-2">{e.startDate ? fmtDate(e.startDate, locale) : t.common.tbd}{e.endDate ? ` — ${fmtDate(e.endDate, locale)}` : ""}</span>
                    <Badge tone="cyan">{t.eventStatus[e.status]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {f.coords ? (
            <MiniMap atlas={atlas} locale={locale} t={t} features={features} center={center} zoom={f.coords.precision === "city" ? 9 : 12.5} />
          ) : (
            <div className="rounded-2xl border border-dashed border-line-2 p-6 text-sm text-ink-3">{t.common.coordinates}: {t.common.tbd}</div>
          )}
          {artists.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-xl font-semibold">{t.common.notableArtists}</h2>
              <LinkChips items={artists.map((a) => ({ href: hrefFor(locale, "artist", a.slug), label: tx(a.name, locale) }))} />
              <p className="mt-2 text-xs text-ink-3">{locale === "ru" ? "Исторические лайнапы по годам добавляются вместе с источниками выпусков." : "Year-by-year line-ups are added together with edition sources."}</p>
            </section>
          )}
          <Gallery media={atlas.mediaOf("festival", f.slug)} locale={locale} title={t.common.gallery} emptyLabel={t.common.placeholder} />
        </div>
        <aside className="space-y-6">
          <KeyFacts items={[
            { label: t.common.city, value: tx(city?.name, locale) + (country ? `, ${tx(country.name, locale)}` : "") },
            { label: t.common.venue, value: f.venueName ?? t.common.tbd },
            { label: t.common.coordinates, value: f.coords ? <span><span className="font-mono text-xs">{fmtCoord(f.coords.lat, f.coords.lng)}</span><span className="block text-xs text-ink-3">{t.precision[f.coords.precision]}</span></span> : t.common.tbd },
            { label: t.common.founded, value: f.foundedYear ?? t.common.tbd },
            { label: t.common.closed, value: f.endedYear },
            { label: t.common.type, value: t.festivalType[f.type] },
            { label: t.common.usualMonths, value: f.usualMonths.length ? <span>{f.usualMonths.map((m) => t.months[m - 1]).join(", ")}<span className="block text-xs text-ink-3">{t.common.usualMonthsNote}</span></span> : t.common.tbd },
            { label: t.common.duration, value: f.usualDurationDays ? `${f.usualDurationDays} ${t.common.days}` : t.common.tbd },
            { label: t.common.attendance, value: f.attendance ? tx(f.attendance, locale) : t.common.tbd },
            { label: t.common.genres, value: f.genres.map((g) => tx(atlas.genre(g)?.name, locale)).join(", ") },
            { label: t.common.tickets, value: site ? <a href={site} target="_blank" rel="noopener noreferrer" className="text-cyan hover:text-acid">{new URL(site).hostname}</a> : t.common.tbd },
          ]} />
          <SourcesList atlas={atlas} refs={f.sources} verification={f.verification} checkedAt={f.checkedAt} t={t} locale={locale} />
        </aside>
      </div>
    </>
  );
}
