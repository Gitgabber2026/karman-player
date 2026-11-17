import { notFound } from "next/navigation";
import { pageContext } from "@/lib/page";
import { tx, hrefFor } from "@/lib/atlas";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SourcesList } from "@/components/sources-list";
import { KeyFacts } from "@/components/key-facts";
import { LinkChips } from "@/components/link-chips";
import { Badge } from "@/components/ui/badge";
import { Gallery } from "@/components/gallery";
import { MiniMap } from "@/components/mini-map";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug, locale } = await params;
  const { atlas } = await pageContext(params);
  const g = atlas.genre(slug);
  return g ? { title: tx(g.name, locale as "ru"), description: tx(g.summary, locale as "ru") } : {};
}

const relLabel = { ru: { "derived-from": "происходит от", "influenced-by": "под влиянием", "fusion-of": "сплав с", related: "родственный" }, en: { "derived-from": "derived from", "influenced-by": "influenced by", "fusion-of": "fusion with", related: "related to" } };
const relLabelIn = { ru: { "derived-from": "породил", "influenced-by": "повлиял на", "fusion-of": "вошёл в сплав", related: "родственный" }, en: { "derived-from": "gave rise to", "influenced-by": "influenced", "fusion-of": "part of fusion", related: "related to" } };

export default async function GenrePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const { locale, t, atlas } = await pageContext(params);
  const g = atlas.genre(slug);
  if (!g) notFound();
  const parent = g.parent ? atlas.genre(g.parent) : undefined;
  const children = atlas.childGenres(g.slug);
  const related = atlas.relatedGenres(g.slug);
  const origins = g.originCities.map((c) => atlas.city(c)).filter((c): c is NonNullable<typeof c> => !!c);
  const artists = atlas.artistsWithGenre(g.slug);
  const venues = atlas.venuesWithGenre(g.slug);
  const festivals = atlas.festivalsWithGenre(g.slug);
  const labels = g.labels.map((l) => atlas.label(l)).filter((l): l is NonNullable<typeof l> => !!l);
  const eras = atlas.erasOfGenre(g.slug);
  const features = atlas.mapFeatures(locale).filter((f) => f.properties.genres.split(",").includes(g.slug) || (f.properties.kind === "city" && g.originCities.includes(f.properties.slug)));
  return (
    <>
      <PageHero kicker={<Breadcrumbs items={[{ label: t.nav.genres, href: `/${locale}/genres` }, { label: t.family[g.family] }, ...(parent ? [{ label: tx(parent.name, locale), href: hrefFor(locale, "genre", parent.slug) }] : []), { label: tx(g.name, locale) }]} />}
        title={tx(g.name, locale)} subtitle={tx(g.summary, locale)} seed={g.slug} kindLabel={t.family[g.family]} placeholderLabel={t.common.placeholder}>
        {g.bpm && <Badge tone="acid">{g.bpm[0]}–{g.bpm[1]} BPM</Badge>}
        {g.periodStart && <Badge tone="cyan">~{g.periodStart}</Badge>}
        {origins.map((c) => <Badge key={c.slug} tone="violet">{tx(c.name, locale)}</Badge>)}
      </PageHero>
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="min-w-0 space-y-12">
          <section>
            <h2 className="mb-3 font-display text-xl font-semibold">{t.common.characteristics}</h2>
            <p className="prose-atlas">{tx(g.characteristics, locale)}</p>
            {g.rhythm && <p className="mt-3 text-sm text-ink-2"><span className="text-ink-3">{t.common.rhythm}: </span>{tx(g.rhythm, locale)}</p>}
          </section>
          {eras.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-xl font-semibold">{locale === "ru" ? "Исторический контекст" : "Historical context"}</h2>
              {eras.map((e) => <div key={e.slug} className="mb-4"><a href={hrefFor(locale, "era", e.slug)} className="font-mono text-xs text-acid">{e.startYear}–{e.endYear} · {tx(e.name, locale)}</a><p className="prose-atlas mt-1">{tx(e.context, locale)}</p></div>)}
            </section>
          )}
          {g.keyReleases.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-xl font-semibold">{t.common.releases}</h2>
              <ul className="divide-y divide-line rounded-2xl border border-line">{g.keyReleases.map((r) => <li key={r.title} className="flex gap-4 p-3 text-sm"><span className="font-mono text-cyan">{r.year}</span><span className="font-medium">{r.title}</span><span className="text-ink-2">{r.artist}</span></li>)}</ul>
            </section>
          )}
          {(artists.length > 0 || (g.keyArtistNames?.length ?? 0) > 0) && (
            <section>
              <h2 className="mb-3 font-display text-xl font-semibold">{t.common.artists}</h2>
              <LinkChips items={artists.map((a) => ({ href: hrefFor(locale, "artist", a.slug), label: tx(a.name, locale) }))} />
              {g.keyArtistNames && g.keyArtistNames.length > 0 && <p className="mt-3 text-sm text-ink-2">{g.keyArtistNames.join(", ")}</p>}
            </section>
          )}
          {features.length > 0 && <MiniMap atlas={atlas} locale={locale} t={t} features={features} center={[10, 35]} zoom={1.3} mode="hero" />}
          {venues.length > 0 && (<section><h2 className="mb-3 font-display text-xl font-semibold">{t.common.clubs}</h2><LinkChips items={venues.map((v) => ({ href: hrefFor(locale, "venue", v.slug), label: tx(v.name, locale), hint: tx(atlas.city(v.city)?.name, locale) }))} /></section>)}
          {festivals.length > 0 && (<section><h2 className="mb-3 font-display text-xl font-semibold">{t.common.festivals}</h2><LinkChips items={festivals.map((f) => ({ href: hrefFor(locale, "festival", f.slug), label: tx(f.name, locale) }))} /></section>)}
          <Gallery media={atlas.mediaOf("genre", g.slug)} locale={locale} title={t.common.gallery} emptyLabel={t.common.placeholder} />
        </div>
        <aside className="space-y-6">
          <KeyFacts items={[
            { label: t.common.bpm, value: g.bpm ? `${g.bpm[0]}–${g.bpm[1]} BPM` : locale === "ru" ? "не применим" : "n/a" },
            { label: t.common.period, value: g.periodStart ? `~${g.periodStart}` : t.common.tbd },
            { label: t.common.origins, value: origins.length ? origins.map((c) => tx(c.name, locale)).join(", ") : t.common.tbd },
            { label: t.common.instruments, value: g.instruments.join(", ") || null },
            { label: t.common.labels, value: labels.length ? labels.map((l) => tx(l.name, locale)).join(", ") : null },
          ]} />
          {parent && <div><h3 className="mb-2 text-xs uppercase tracking-widest text-ink-3">{t.common.parent}</h3><LinkChips items={[{ href: hrefFor(locale, "genre", parent.slug), label: tx(parent.name, locale) }]} /></div>}
          {children.length > 0 && <div><h3 className="mb-2 text-xs uppercase tracking-widest text-ink-3">{t.common.subgenres}</h3><LinkChips items={children.map((c) => ({ href: hrefFor(locale, "genre", c.slug), label: tx(c.name, locale) }))} /></div>}
          {related.length > 0 && <div><h3 className="mb-2 text-xs uppercase tracking-widest text-ink-3">{t.common.relatedGenres}</h3><LinkChips items={related.map((r) => ({ href: hrefFor(locale, "genre", r.genre.slug), label: tx(r.genre.name, locale), hint: (r.direction === "out" ? relLabel : relLabelIn)[locale][r.type] }))} /></div>}
          <a href={`/${locale}/connections?kind=genre&slug=${g.slug}`} className="inline-block text-sm text-cyan hover:text-acid">{t.nav.connections} →</a>
          <SourcesList atlas={atlas} refs={g.sources} verification={g.verification} checkedAt={g.checkedAt} t={t} locale={locale} />
        </aside>
      </div>
    </>
  );
}
