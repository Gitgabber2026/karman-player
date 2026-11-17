import Link from "next/link";
import { pageContext } from "@/lib/page";
import { tx, hrefFor } from "@/lib/atlas";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PlaceholderArt } from "@/components/placeholder-art";

export const dynamic = "force-dynamic";
export const metadata = { title: "Маршруты / Routes" };

export default async function Routes({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t, atlas } = await pageContext(params);
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t.map.world, href: `/${locale}` }, { label: t.nav.routes }]} />
      <h1 className="mt-6 font-display text-4xl font-semibold sm:text-6xl">{t.sections.routes}</h1>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {atlas.d.routes.map((r) => (
          <Link key={r.slug} href={hrefFor(locale, "route", r.slug)} className="group relative overflow-hidden rounded-2xl border border-line bg-card p-6 hover:border-line-2">
            <PlaceholderArt seed={r.slug} label={tx(r.name, locale)} className="absolute inset-0 opacity-50" />
            <div className="relative">
              <div className="font-mono text-xs text-cyan">{tx(atlas.city(r.city)?.name, locale)} · {r.stops.length} stops</div>
              <h2 className="mt-2 font-display text-2xl font-semibold group-hover:text-acid">{tx(r.name, locale)}</h2>
              <p className="mt-2 max-w-md text-sm text-ink-2">{tx(r.summary, locale)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
