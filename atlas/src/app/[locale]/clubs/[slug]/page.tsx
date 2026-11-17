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
import { fmtCoord, safeUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug, locale } = await params;
  const { atlas } = await pageContext(params);
  const v = atlas.venue(slug);
  return v ? { title: tx(v.name, locale as "ru"), description: tx(v.summary, locale as "ru") } : {};
}

export default async function ClubPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const { locale, t, atlas } = await pageContext(params);
  const v = atlas.venue(slug);
  if (!v) notFound();
  const city = atlas.city(v.city);
  const country = atlas.countryOfCity(v.city);
  const residents = v.residents.map((r) => atlas.artist(r)).filter((a): a is NonNullable<typeof a> => !!a);
  const site = safeUrl(v.website);
  const milestones = atlas.d.milestones.filter((m) => m.venues.includes(v.slug));
  const features = atlas.mapFeatures(locale).filter((f) => f.properties.city === v.city);
  return (
    <>
      <PageHero
        kicker={<Breadcrumbs items={[{ label: tx(country?.name, locale), href: hrefFor(locale, "country", country?.slug ?? "") }, { label: tx(city?.name, locale), href: hrefFor(locale, "city", v.city) }, { label: t.nav.clubs, href: `/${locale}/clubs` }, { label: tx(v.name, locale) }]} />}
        title={tx(v.name, locale)} subtitle={tx(v.summary, locale)} seed={v.slug} kindLabel={t.venueKind[v.kind]} placeholderLabel={t.common.placeholder}>
        <Badge tone={["active", "seasonal"].includes(v.status) ? "cyan" : "violet"}>{t.venueStatus[v.status]}</Badge>
        {v.legendary && <Badge tone="acid">Legendary</Badge>}
        <FavoriteButton entity="venue" slug={v.slug} title={tx(v.name, locale)} labels={{ favorite: t.common.favorite, favorited: t.common.favorited, visited: t.common.visited, saved: t.common.saved }} kinds={["favorite", "visited"]} />
      </PageHero>
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="min-w-0 space-y-12">
          <ArticleSections sections={v.sections} facts={v.facts} locale={locale} factsLabel={t.common.facts} />
          {(v.architecture || v.soundSystem) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {v.architecture && <div className="rounded-2xl border border-line bg-card p-5"><h3 className="mb-2 text-xs uppercase tracking-widest text-ink-3">{t.common.architecture}</h3><p className="text-sm leading-relaxed">{tx(v.architecture, locale)}</p></div>}
              {v.soundSystem && <div className="rounded-2xl border border-line bg-card p-5"><h3 className="mb-2 text-xs uppercase tracking-widest text-ink-3">{t.common.soundSystem}</h3><p className="text-sm leading-relaxed">{tx(v.soundSystem, locale)}</p></div>}
            </div>
          )}
          {v.coords ? (
            <MiniMap atlas={atlas} locale={locale} t={t} features={features} center={[v.coords.lng, v.coords.lat]} zoom={14} />
          ) : (
            <div className="rounded-2xl border border-dashed border-line-2 p-6 text-sm text-ink-3">{t.common.coordinates}: {t.common.tbd}</div>
          )}
          {(residents.length > 0 || (v.residentNames?.length ?? 0) > 0) && (
            <section>
              <h2 className="mb-4 font-display text-xl font-semibold">{t.common.residents}</h2>
              <LinkChips items={residents.map((a) => ({ href: hrefFor(locale, "artist", a.slug), label: tx(a.name, locale) }))} />
              {v.residentNames && v.residentNames.length > 0 && <p className="mt-3 text-sm text-ink-2">{v.residentNames.join(", ")}</p>}
            </section>
          )}
          {milestones.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-xl font-semibold">{t.common.milestones}</h2>
              <ul className="space-y-2">{milestones.map((m) => <li key={m.slug}><span className="font-mono text-xs text-acid">{m.year}</span> {tx(m.title, locale)}</li>)}</ul>
            </section>
          )}
          <Gallery media={atlas.mediaOf("venue", v.slug)} locale={locale} title={t.common.gallery} emptyLabel={t.common.placeholder} />
        </div>
        <aside className="space-y-6">
          <KeyFacts items={[
            { label: t.common.city, value: tx(city?.name, locale) + (country ? `, ${tx(country.name, locale)}` : "") },
            { label: t.common.address, value: v.address ?? t.common.tbd },
            { label: t.common.coordinates, value: v.coords ? <span><span className="font-mono text-xs">{fmtCoord(v.coords.lat, v.coords.lng)}</span><span className="block text-xs text-ink-3">{t.precision[v.coords.precision]}</span></span> : t.common.tbd },
            { label: t.common.type, value: t.venueKind[v.kind] },
            { label: t.common.opened, value: v.openedYear ?? t.common.tbd },
            { label: t.common.closed, value: v.closedYear },
            { label: t.common.status, value: t.venueStatus[v.status] },
            { label: t.common.capacity, value: v.capacity ?? t.common.tbd },
            { label: t.common.genres, value: v.genres.map((g) => tx(atlas.genre(g)?.name, locale)).join(", ") },
            { label: t.common.website, value: site ? <a href={site} target="_blank" rel="noopener noreferrer" className="text-cyan hover:text-acid">{new URL(site).hostname}</a> : t.common.tbd },
          ]} />
          <SourcesList atlas={atlas} refs={v.sources} verification={v.verification} checkedAt={v.checkedAt} t={t} locale={locale} />
        </aside>
      </div>
    </>
  );
}
