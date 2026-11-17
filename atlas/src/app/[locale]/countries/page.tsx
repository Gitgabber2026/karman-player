import Link from "next/link";
import { pageContext } from "@/lib/page";
import { tx, hrefFor } from "@/lib/atlas";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Страны / Countries" };

export default async function Countries({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t, atlas } = await pageContext(params);
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t.map.world, href: `/${locale}` }, { label: t.nav.countries }]} />
      <h1 className="mt-6 font-display text-4xl font-semibold sm:text-6xl">{t.nav.countries}</h1>
      <div className="mt-12 space-y-14">
        {atlas.d.continents.map((c) => (
          <section key={c.slug}>
            <div className="mb-5 flex items-baseline justify-between border-b border-line pb-3">
              <h2 className="font-display text-2xl font-semibold"><Link href={hrefFor(locale, "continent", c.slug)} className="hover:text-acid">{tx(c.name, locale)}</Link></h2>
              <span className="font-mono text-xs text-ink-3">{atlas.countriesIn(c.slug).length}</span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {atlas.countriesIn(c.slug).map((country) => {
                const s = atlas.countryStats(country.slug);
                return (
                  <li key={country.slug}>
                    <Link href={hrefFor(locale, "country", country.slug)} className="group block h-full rounded-2xl border border-line bg-card p-4 hover:border-line-2">
                      <div className="flex items-center justify-between"><span className="font-display text-lg group-hover:text-acid">{tx(country.name, locale)}</span><span className="font-mono text-[10px] text-ink-3">{country.iso2}</span></div>
                      <p className="mt-1 line-clamp-2 text-sm text-ink-2">{tx(country.summary, locale)}</p>
                      <div className="mt-3 flex gap-3 font-mono text-[11px] text-ink-3"><span>{s.clubs} {t.common.clubs.toLowerCase()}</span><span>{s.festivals} {t.common.festivals.toLowerCase()}</span><span>{s.artists} {t.common.artists.toLowerCase()}</span></div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
