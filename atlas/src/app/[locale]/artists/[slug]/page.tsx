import { notFound } from "next/navigation";
import { pageContext } from "@/lib/page";
import { tx, hrefFor, filterEvents } from "@/lib/atlas";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ArticleSections } from "@/components/article-sections";
import { SourcesList } from "@/components/sources-list";
import { KeyFacts } from "@/components/key-facts";
import { LinkChips } from "@/components/link-chips";
import { Badge } from "@/components/ui/badge";
import { Gallery } from "@/components/gallery";
import { FavoriteButton } from "@/components/favorite-button";
import { safeUrl } from "@/lib/utils";
import { normalize } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug, locale } = await params;
  const { atlas } = await pageContext(params);
  const a = atlas.artist(slug);
  return a ? { title: tx(a.name, locale as "ru"), description: tx(a.summary, locale as "ru") } : {};
}

export default async function ArtistPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const { locale, t, atlas } = await pageContext(params);
  const a = atlas.artist(slug);
  if (!a) notFound();
  const country = atlas.country(a.country);
  const city = a.city ? atlas.city(a.city) : undefined;
  const residencies = atlas.residenciesOf(a.slug);
  const festivals = atlas.festivalsOfArtist(a.slug);
  const labels = a.labels.map((l) => atlas.label(l)).filter((l): l is NonNullable<typeof l> => !!l);
  const site = safeUrl(a.website);
  const name = normalize(tx(a.name, "en"));
  const upcoming = filterEvents(atlas.d.events, { period: "upcoming" }, new Date(), () => undefined).filter((e) => e.lineup.some((n) => normalize(n) === name));
  const milestones = atlas.d.milestones.filter((m) => m.artists.includes(a.slug));
  return (
    <>
      <PageHero kicker={<Breadcrumbs items={[{ label: t.nav.artists, href: `/${locale}/artists` }, { label: tx(country?.name, locale), href: hrefFor(locale, "country", a.country) }, { label: tx(a.name, locale) }]} />}
        title={tx(a.name, locale)} subtitle={tx(a.summary, locale)} seed={a.slug} kindLabel={t.artistKind[a.kind]} placeholderLabel={t.common.placeholder}>
        <Badge tone="cyan">{t.artistKind[a.kind]}</Badge>
        {a.genres.map((g) => <Badge key={g} tone="violet">{tx(atlas.genre(g)?.name, locale)}</Badge>)}
        <FavoriteButton entity="artist" slug={a.slug} title={tx(a.name, locale)} labels={{ favorite: t.common.favorite, favorited: t.common.favorited, visited: t.common.visited, saved: t.common.saved }} />
      </PageHero>
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="min-w-0 space-y-12">
          <ArticleSections sections={a.sections} facts={a.facts} locale={locale} factsLabel={t.common.facts} />
          <section>
            <h2 className="mb-3 font-display text-xl font-semibold">{t.common.releases}</h2>
            {a.releases.length === 0 ? <p className="text-sm text-ink-3">{t.common.tbd}</p> : (
              <ul className="divide-y divide-line rounded-2xl border border-line">
                {[...a.releases].sort((x, y) => x.year - y.year).map((r) => (
                  <li key={r.title} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 p-3 text-sm"><span className="font-mono text-cyan">{r.year}</span><span className="font-medium">{r.title}</span><span className="text-xs uppercase text-ink-3">{r.kind}{r.label ? ` · ${r.label}` : ""}</span></li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-ink-3">{locale === "ru" ? "Это избранные релизы, а не полная дискография." : "Selected releases, not a full discography."}</p>
          </section>
          {residencies.length > 0 && (<section><h2 className="mb-3 font-display text-xl font-semibold">{t.common.residencies}</h2><LinkChips items={residencies.map((v) => ({ href: hrefFor(locale, "venue", v.slug), label: tx(v.name, locale), hint: tx(atlas.city(v.city)?.name, locale) }))} /></section>)}
          {festivals.length > 0 && (<section><h2 className="mb-3 font-display text-xl font-semibold">{t.common.festivalsPlayed}</h2><LinkChips items={festivals.map((f) => ({ href: hrefFor(locale, "festival", f.slug), label: tx(f.name, locale) }))} /></section>)}
          {milestones.length > 0 && (<section><h2 className="mb-3 font-display text-xl font-semibold">{t.common.milestones}</h2><ul className="space-y-2">{milestones.map((m) => <li key={m.slug}><span className="font-mono text-xs text-acid">{m.year}</span> {tx(m.title, locale)}</li>)}</ul></section>)}
          <section>
            <h2 className="mb-3 font-display text-xl font-semibold">{t.common.upcoming}</h2>
            {upcoming.length === 0 ? <p className="text-sm text-ink-3">{t.common.noUpcoming}</p> : <LinkChips items={upcoming.map((e) => ({ href: hrefFor(locale, "event", e.id), label: e.title, hint: e.startAt.slice(0, 10) }))} />}
          </section>
          <Gallery media={atlas.mediaOf("artist", a.slug)} locale={locale} title={t.common.gallery} emptyLabel={t.common.placeholder} />
        </div>
        <aside className="space-y-6">
          <KeyFacts items={[
            { label: t.common.realName, value: a.realName },
            { label: t.common.origin, value: [city ? tx(city.name, locale) : null, tx(country?.name, locale)].filter(Boolean).join(", ") + (a.originNote ? "" : "") },
            { label: locale === "ru" ? "Уточнение" : "Note", value: a.originNote ? tx(a.originNote, locale) : null },
            { label: t.common.careerStart, value: a.careerStartYear ?? t.common.tbd },
            { label: t.common.labels, value: labels.length ? <span className="flex flex-wrap gap-x-2">{labels.map((l) => <a key={l.slug} href={hrefFor(locale, "label", l.slug)} className="text-cyan hover:text-acid">{tx(l.name, locale)}</a>)}</span> : null },
            { label: t.common.website, value: site ? <a href={site} target="_blank" rel="noopener noreferrer" className="text-cyan">{new URL(site).hostname}</a> : t.common.tbd },
          ]} />
          <a href={`/${locale}/connections?kind=artist&slug=${a.slug}`} className="inline-block text-sm text-cyan hover:text-acid">{t.nav.connections} →</a>
          <SourcesList atlas={atlas} refs={a.sources} verification={a.verification} checkedAt={a.checkedAt} t={t} locale={locale} />
        </aside>
      </div>
    </>
  );
}
