import { notFound } from "next/navigation";
import Link from "next/link";
import { pageContext } from "@/lib/page";
import { tx, hrefFor } from "@/lib/atlas";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ArticleSections } from "@/components/article-sections";
import { SourcesList } from "@/components/sources-list";
import { MiniMap } from "@/components/mini-map";
import { EntityCard } from "@/components/entity-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug, locale } = await params;
  const { atlas } = await pageContext(params);
  const c = atlas.continent(slug);
  return c ? { title: tx(c.name, locale as "ru"), description: tx(c.summary, locale as "ru") } : {};
}

export default async function ContinentPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const { locale, t, atlas } = await pageContext(params);
  const c = atlas.continent(slug);
  if (!c) notFound();
  const countries = atlas.countriesIn(c.slug);
  const set = new Set(countries.map((x) => x.slug));
  const features = atlas.mapFeatures(locale).filter((f) => f.properties.continent === c.slug);
  const capitals = atlas.capitals().filter((x) => set.has(x.country));
  const stats = atlas.continentStats(c.slug);
  return (
    <>
      <PageHero kicker={<Breadcrumbs items={[{ label: t.map.world, href: `/${locale}/countries` }, { label: tx(c.name, locale) }]} />} title={tx(c.name, locale)} subtitle={tx(c.summary, locale)} seed={c.slug} kindLabel={t.kinds.continent} placeholderLabel={t.common.placeholder}>
        {([[stats.countries, t.common.countries], [stats.cities, t.common.cities], [stats.clubs, t.common.clubs], [stats.festivals, t.common.festivals], [stats.artists, t.common.artists]] as const).map(([n, l]) => (
          <div key={l} className="rounded-xl border border-line-2 bg-bg/60 px-4 py-2 backdrop-blur"><div className="font-display text-xl">{n}</div><div className="text-[10px] uppercase tracking-wider text-ink-3">{l}</div></div>
        ))}
      </PageHero>
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <div className="space-y-12">
          <ArticleSections sections={c.sections} locale={locale} factsLabel={t.common.facts} />
          <MiniMap atlas={atlas} locale={locale} t={t} features={features} center={c.center} zoom={c.zoom} mode="hero" />
          <section>
            <h2 className="mb-4 font-display text-xl font-semibold">{t.common.countries}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {countries.map((x) => (
                <li key={x.slug}><Link href={hrefFor(locale, "country", x.slug)} className="block rounded-xl border border-line bg-card p-4 hover:border-cyan">
                  <div className="font-display">{tx(x.name, locale)}</div><p className="mt-1 line-clamp-2 text-sm text-ink-2">{tx(x.summary, locale)}</p>
                </Link></li>
              ))}
            </ul>
          </section>
          {capitals.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-xl font-semibold">{t.sections.capitals}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {capitals.map((x) => <EntityCard key={x.slug} href={hrefFor(locale, "city", x.slug)} title={tx(x.name, locale)} subtitle={tx(atlas.country(x.country)?.name, locale)} kindLabel={t.kinds.city} seed={x.slug} />)}
              </div>
            </section>
          )}
        </div>
        <aside><SourcesList atlas={atlas} refs={c.sources} verification={c.verification} checkedAt={c.checkedAt} t={t} locale={locale} /></aside>
      </div>
    </>
  );
}
