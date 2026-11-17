import { notFound } from "next/navigation";
import Link from "next/link";
import { pageContext } from "@/lib/page";
import { tx, hrefFor, type MapFeature } from "@/lib/atlas";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MiniMap } from "@/components/mini-map";
import { fmtCoord } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RoutePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const { locale, t, atlas } = await pageContext(params);
  const r = atlas.route(slug);
  if (!r) notFound();
  const city = atlas.city(r.city);
  const features: MapFeature[] = r.stops.map((s, i) => ({
    type: "Feature", geometry: { type: "Point", coordinates: [s.coords.lng, s.coords.lat] },
    properties: { id: `stop:${i}`, kind: s.venue ? "venue" : "milestone", slug: s.venue ?? `${r.slug}-${i}`, name: `${i + 1}. ${tx(s.title, locale)}`, subtitle: tx(s.description, locale),
      href: s.venue ? hrefFor(locale, "venue", s.venue) : hrefFor(locale, "route", r.slug), genres: "", continent: "", country: city?.country ?? "", city: r.city, status: "active", legendary: false, startYear: -1, endYear: 9999, precision: s.coords.precision, weight: 1 },
  }));
  const lat = r.stops.reduce((a, s) => a + s.coords.lat, 0) / r.stops.length;
  const lng = r.stops.reduce((a, s) => a + s.coords.lng, 0) / r.stops.length;
  return (
    <>
      <PageHero kicker={<Breadcrumbs items={[{ label: t.nav.routes, href: `/${locale}/routes` }, { label: tx(city?.name, locale), href: hrefFor(locale, "city", r.city) }, { label: tx(r.name, locale) }]} />} title={tx(r.name, locale)} subtitle={tx(r.summary, locale)} seed={r.slug} kindLabel="Route" placeholderLabel={t.common.placeholder} />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <ol className="space-y-4">
          {r.stops.map((s, i) => (
            <li key={i} className="flex gap-4 rounded-2xl border border-line bg-card p-5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cyan/60 font-mono text-sm text-cyan">{i + 1}</span>
              <div>
                <h2 className="font-display text-lg font-semibold">{s.venue ? <Link href={hrefFor(locale, "venue", s.venue)} className="hover:text-acid">{tx(s.title, locale)}</Link> : tx(s.title, locale)}</h2>
                <p className="mt-1 text-sm text-ink-2">{tx(s.description, locale)}</p>
                <p className="mt-2 font-mono text-[11px] text-ink-3">{fmtCoord(s.coords.lat, s.coords.lng)} · {t.precision[s.coords.precision]}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <MiniMap atlas={atlas} locale={locale} t={t} features={features} center={[lng, lat]} zoom={r.slug === "uk-rave-heritage" ? 6 : 11.5} className="h-[520px] overflow-hidden rounded-2xl border border-line" />
        </div>
      </div>
    </>
  );
}
