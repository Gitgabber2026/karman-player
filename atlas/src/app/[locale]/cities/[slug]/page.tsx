import { notFound } from "next/navigation";
import Link from "next/link";
import { pageContext } from "@/lib/page";
import { tx, hrefFor, filterEvents } from "@/lib/atlas";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ArticleSections } from "@/components/article-sections";
import { SourcesList } from "@/components/sources-list";
import { MiniMap } from "@/components/mini-map";
import { EntityCard } from "@/components/entity-card";
import { LinkChips } from "@/components/link-chips";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/verification-badge";
import { Gallery } from "@/components/gallery";
import { FavoriteButton } from "@/components/favorite-button";
import { fmtCoord } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug, locale } = await params;
  const { atlas } = await pageContext(params);
  const c = atlas.city(slug);
  return c ? { title: tx(c.name, locale as "ru"), description: tx(c.summary, locale as "ru") } : {};
}

export default async function CityPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const { locale, t, atlas } = await pageContext(params);
  const c = atlas.city(slug);
  if (!c) notFound();
  const country = atlas.country(c.country);
  const venues = atlas.venuesIn(c.slug);
  const active = venues.filter((v) => !["closed", "historical"].includes(v.status));
  const gone = venues.filter((v) => ["closed", "historical"].includes(v.status));
  const festivals = atlas.festivalsIn(c.slug);
  const artists = atlas.artistsInCity(c.slug);
  const labels = atlas.labelsInCity(c.slug);
  const genresBorn = atlas.genresOriginIn(c.slug);
  const milestones = atlas.milestonesIn(c.slug).sort((a, b) => a.year - b.year);
  const routes = atlas.routesIn(c.slug);
  const events = filterEvents(atlas.d.events, { period: "upcoming", city: c.slug }, new Date(), (x) => atlas.countryOfCity(x)?.slug);
  const features = atlas.mapFeatures(locale).filter((f) => f.properties.city === c.slug || (f.properties.kind === "milestone" && f.properties.city === c.slug));
  return (
    <>
      <PageHero
        kicker={<Breadcrumbs items={[{ label: t.map.world, href: `/${locale}/countries` }, { label: tx(country?.name, locale), href: hrefFor(locale, "country", c.country) }, { label: tx(c.name, locale) }]} />}
        title={tx(c.name, locale)} subtitle={tx(c.summary, locale)} seed={c.slug} kindLabel={t.kinds.city} placeholderLabel={t.common.placeholder}>
        <FavoriteButton entity="city" slug={c.slug} title={tx(c.name, locale)} labels={{ favorite: t.common.favorite, favorited: t.common.favorited, visited: t.common.visited, saved: t.common.saved }} kinds={["favorite", "visited"]} />
      </PageHero>
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <div className="min-w-0 space-y-14">
          <ArticleSections sections={c.sections} facts={c.facts} locale={locale} factsLabel={t.common.facts} />
          <MiniMap atlas={atlas} locale={locale} t={t} features={features} center={[c.coords.lng, c.coords.lat]} zoom={11.3} />
          {active.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-xl font-semibold">{t.common.clubs}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((v) => <EntityCard key={v.slug} href={hrefFor(locale, "venue", v.slug)} title={tx(v.name, locale)} subtitle={`${t.venueKind[v.kind]} · ${v.openedYear ?? "—"}`} kindLabel={t.venueKind[v.kind]} seed={v.slug} badges={<Badge tone="cyan">{t.venueStatus[v.status]}</Badge>} />)}
              </div>
            </section>
          )}
          {gone.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-xl font-semibold">{t.sections.legendary} · {t.venueStatus.closed}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gone.map((v) => <EntityCard key={v.slug} href={hrefFor(locale, "venue", v.slug)} title={tx(v.name, locale)} subtitle={`${v.openedYear ?? "—"}–${v.closedYear ?? "—"}`} kindLabel={t.venueKind[v.kind]} seed={v.slug} badges={<Badge tone="violet">{t.venueStatus[v.status]}</Badge>} />)}
              </div>
            </section>
          )}
          {festivals.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-xl font-semibold">{t.common.festivals}</h2>
              <LinkChips items={festivals.map((f) => ({ href: hrefFor(locale, "festival", f.slug), label: tx(f.name, locale), hint: f.foundedYear ? String(f.foundedYear) : undefined }))} />
            </section>
          )}
          <section>
            <h2 className="mb-4 font-display text-xl font-semibold">{t.common.events}</h2>
            {events.length ? (
              <LinkChips items={events.map((e) => ({ href: hrefFor(locale, "event", e.id), label: e.title, hint: e.startAt.slice(0, 10) }))} />
            ) : (
              <p className="text-sm text-ink-3">{locale === "ru" ? "Подтверждённых предстоящих событий в базе нет." : "No confirmed upcoming events."} <Link href={`/${locale}/events?city=${c.slug}`} className="text-cyan">{t.nav.events} →</Link></p>
            )}
          </section>
          {milestones.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-xl font-semibold">{t.common.milestones}</h2>
              <ol className="space-y-3 border-l border-line pl-5">
                {milestones.map((m) => (
                  <li key={m.slug} className="relative"><span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-acid" />
                    <span className="font-mono text-xs text-acid">{m.year}</span> <span className="font-medium">{tx(m.title, locale)}</span>
                    <p className="text-sm text-ink-2">{tx(m.summary, locale)}</p></li>
                ))}
              </ol>
            </section>
          )}
          <Gallery media={atlas.mediaOf("city", c.slug)} locale={locale} title={t.common.gallery} emptyLabel={t.common.placeholder} />
        </div>
        <aside className="space-y-6">
          <div className="rounded-2xl border border-line bg-bg-2 p-5 text-sm">
            <div className="text-ink-3">{t.common.coordinates}</div>
            <div className="mt-1 font-mono">{fmtCoord(c.coords.lat, c.coords.lng)}</div>
            <div className="mt-1 text-xs text-ink-3">{t.common.precision}: {t.precision[c.coords.precision]}</div>
          </div>
          {genresBorn.length > 0 && (<div><h3 className="mb-2 text-xs uppercase tracking-widest text-ink-3">{t.common.origins}</h3><LinkChips items={genresBorn.map((g) => ({ href: hrefFor(locale, "genre", g.slug), label: tx(g.name, locale) }))} /></div>)}
          {c.genres.length > 0 && (<div><h3 className="mb-2 text-xs uppercase tracking-widest text-ink-3">{t.common.genres}</h3><LinkChips items={c.genres.map((g) => atlas.genre(g)).filter((g): g is NonNullable<typeof g> => !!g).map((g) => ({ href: hrefFor(locale, "genre", g.slug), label: tx(g.name, locale) }))} /></div>)}
          {artists.length > 0 && (<div><h3 className="mb-2 text-xs uppercase tracking-widest text-ink-3">{t.common.artists}</h3><LinkChips items={artists.map((a) => ({ href: hrefFor(locale, "artist", a.slug), label: tx(a.name, locale) }))} /></div>)}
          {labels.length > 0 && (<div><h3 className="mb-2 text-xs uppercase tracking-widest text-ink-3">{t.common.labels}</h3><LinkChips items={labels.map((l) => ({ href: hrefFor(locale, "label", l.slug), label: tx(l.name, locale) }))} /></div>)}
          {routes.length > 0 && (<div><h3 className="mb-2 text-xs uppercase tracking-widest text-ink-3">{t.common.routes}</h3><LinkChips items={routes.map((r) => ({ href: hrefFor(locale, "route", r.slug), label: tx(r.name, locale) }))} /></div>)}
          <div className="flex items-center gap-2"><VerificationBadge status={c.verification} t={t} /></div>
          <SourcesList atlas={atlas} refs={c.sources} verification={c.verification} checkedAt={c.checkedAt} t={t} locale={locale} />
        </aside>
      </div>
    </>
  );
}
