import { notFound } from "next/navigation";
import { pageContext } from "@/lib/page";
import { tx, hrefFor } from "@/lib/atlas";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { KeyFacts } from "@/components/key-facts";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/verification-badge";
import { FavoriteButton } from "@/components/favorite-button";
import { MiniMap } from "@/components/mini-map";
import { fmtCoord, fmtDate, safeUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  const { locale, t, atlas } = await pageContext(params);
  const e = atlas.event(decodeURIComponent(id));
  if (!e) notFound();
  const official = safeUrl(e.officialUrl);
  const dateOpts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" };
  return (
    <>
      <PageHero kicker={<Breadcrumbs items={[{ label: t.nav.events, href: `/${locale}/events` }, { label: e.title }]} />} title={e.title} subtitle={`${e.venueName} · ${e.cityName}`} seed={e.id} kindLabel={t.eventCategory[e.category]} placeholderLabel={t.common.placeholder}
        media={e.imageUrl ? { id: e.id, entityType: "event", entitySlug: e.id, url: e.imageUrl, alt: { ru: e.title }, author: e.provider, license: "© rights holder", licenseUrl: official ?? "", sourceUrl: official ?? "" } : undefined}>
        <Badge tone="cyan">{t.eventStatus[e.status]}</Badge>
        <VerificationBadge status={e.verification} t={t} />
        <FavoriteButton entity="event" slug={e.id} title={e.title} labels={{ favorite: t.common.favorite, favorited: t.common.favorited, visited: t.common.visited, saved: t.common.saved }} kinds={["saved"]} />
      </PageHero>
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="space-y-8">
          {e.description && <p className="prose-atlas">{e.description}</p>}
          {e.lineup.length > 0 && (<section><h2 className="mb-3 font-display text-xl font-semibold">{t.common.lineup}</h2><ul className="flex flex-wrap gap-2">{e.lineup.map((a) => <li key={a} className="rounded-full border border-line px-3 py-1 text-sm">{a}</li>)}</ul></section>)}
          {e.coords && <MiniMap atlas={atlas} locale={locale} t={t} features={[]} center={[e.coords.lng, e.coords.lat]} zoom={14} />}
        </div>
        <aside className="space-y-6">
          <KeyFacts items={[
            { label: locale === "ru" ? "Дата и время" : "Date & time", value: fmtDate(e.startAt, locale, dateOpts) + (e.endAt ? ` — ${fmtDate(e.endAt, locale, dateOpts)}` : "") },
            { label: t.common.city, value: e.city ? <a href={hrefFor(locale, "city", e.city)} className="text-cyan">{e.cityName}</a> : e.cityName },
            { label: t.common.venue, value: e.venueSlug ? <a href={hrefFor(locale, "venue", e.venueSlug)} className="text-cyan">{e.venueName}</a> : e.venueName },
            { label: t.common.address, value: e.address ?? t.common.tbd },
            { label: t.common.coordinates, value: e.coords ? fmtCoord(e.coords.lat, e.coords.lng) : t.common.tbd },
            { label: t.common.category, value: t.eventCategory[e.category] },
            { label: t.common.genres, value: e.genres.map((g) => tx(atlas.genre(g)?.name, locale)).join(", ") || t.common.tbd },
            { label: t.common.organizer, value: e.organizer ?? t.common.tbd },
            { label: t.common.age, value: e.ageRestriction ?? t.common.tbd },
            { label: t.common.price, value: e.price ?? t.common.tbd },
            { label: t.common.officialSource, value: official ? <a href={official} target="_blank" rel="noopener noreferrer" className="text-cyan hover:text-acid">{new URL(official).hostname}</a> : "—" },
            { label: t.common.lastChecked, value: fmtDate(e.checkedAt, locale) },
          ]} />
        </aside>
      </div>
    </>
  );
}
