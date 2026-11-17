import { notFound } from "next/navigation";
import { pageContext } from "@/lib/page";
import { tx, hrefFor } from "@/lib/atlas";
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

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug, locale } = await params;
  const { atlas } = await pageContext(params);
  const c = atlas.country(slug);
  return c ? { title: tx(c.name, locale as "ru"), description: tx(c.summary, locale as "ru") } : {};
}

export default async function CountryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const { locale, t, atlas } = await pageContext(params);
  const c = atlas.country(slug);
  if (!c) notFound();
  const continent = atlas.continent(c.continent);
  const cities = atlas.citiesIn(c.slug);
  const venues = atlas.venuesInCountry(c.slug);
  const festivals = atlas.festivalsInCountry(c.slug);
  const artists = atlas.artistsInCountry(c.slug);
  const milestones = atlas.milestonesInCountry(c.slug).sort((a, b) => a.year - b.year);
  const features = atlas.mapFeatures(locale).filter((f) => f.properties.country === c.slug);
  return (
    <>
      <PageHero
        kicker={<Breadcrumbs items={[{ label: t.map.world, href: `/${locale}/countries` }, { label: tx(continent?.name, locale), href: hrefFor(locale, "continent", c.continent) }, { label: tx(c.name, locale) }]} />}
        title={tx(c.name, locale)} subtitle={tx(c.summary, locale)} seed={c.slug} kindLabel={t.kinds.country} placeholderLabel={t.common.placeholder}>
        <VerificationBadge status={c.verification} t={t} />
        {c.genres.map((g) => atlas.genre(g)).filter(Boolean).map((g) => <Badge key={g!.slug} tone="violet">{tx(g!.name, locale)}</Badge>)}
      </PageHero>
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <div className="min-w-0 space-y-14">
          <ArticleSections sections={c.sections} facts={c.facts} locale={locale} factsLabel={t.common.facts} />
          <MiniMap atlas={atlas} locale={locale} t={t} features={features} center={c.center} zoom={c.zoom} focusCountry={c.slug} />
          {cities.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-xl font-semibold">{t.common.cities}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cities.map((x) => <EntityCard key={x.slug} href={hrefFor(locale, "city", x.slug)} title={tx(x.name, locale)} meta={tx(x.summary, locale)} kindLabel={t.kinds.city} seed={x.slug} />)}
              </div>
            </section>
          )}
          <section>
            <h2 className="mb-4 font-display text-xl font-semibold">{t.common.clubs}</h2>
            <LinkChips items={venues.map((v) => ({ href: hrefFor(locale, "venue", v.slug), label: tx(v.name, locale), hint: tx(atlas.city(v.city)?.name, locale) }))} empty={t.common.tbd} />
          </section>
          <section>
            <h2 className="mb-4 font-display text-xl font-semibold">{t.common.festivals}</h2>
            <LinkChips items={festivals.map((f) => ({ href: hrefFor(locale, "festival", f.slug), label: tx(f.name, locale), hint: f.foundedYear ? String(f.foundedYear) : undefined }))} empty={t.common.tbd} />
          </section>
          <section>
            <h2 className="mb-4 font-display text-xl font-semibold">{t.common.artists}</h2>
            <LinkChips items={artists.map((a) => ({ href: hrefFor(locale, "artist", a.slug), label: tx(a.name, locale) }))} empty={t.common.tbd} />
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
          <Gallery media={atlas.mediaOf("country", c.slug)} locale={locale} title={t.common.gallery} emptyLabel={t.common.placeholder} />
        </div>
        <aside className="space-y-6">
          <SourcesList atlas={atlas} refs={c.sources} verification={c.verification} checkedAt={c.checkedAt} t={t} locale={locale} />
        </aside>
      </div>
    </>
  );
}
