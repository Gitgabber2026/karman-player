import { notFound } from "next/navigation";
import { pageContext } from "@/lib/page";
import { tx, hrefFor } from "@/lib/atlas";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SourcesList } from "@/components/sources-list";
import { KeyFacts } from "@/components/key-facts";
import { LinkChips } from "@/components/link-chips";
import { safeUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LabelPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const { locale, t, atlas } = await pageContext(params);
  const l = atlas.label(slug);
  if (!l) notFound();
  const artists = atlas.artistsOfLabel(l.slug);
  const founders = l.founders.map((a) => atlas.artist(a)).filter((a): a is NonNullable<typeof a> => !!a);
  const site = safeUrl(l.website);
  return (
    <>
      <PageHero kicker={<Breadcrumbs items={[{ label: t.nav.labels, href: `/${locale}/labels` }, { label: tx(l.name, locale) }]} />} title={tx(l.name, locale)} subtitle={tx(l.summary, locale)} seed={l.slug} kindLabel={t.kinds.label} placeholderLabel={t.common.placeholder} />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="space-y-10">
          {founders.length > 0 && <section><h2 className="mb-3 font-display text-xl font-semibold">{locale === "ru" ? "Основатели" : "Founders"}</h2><LinkChips items={founders.map((a) => ({ href: hrefFor(locale, "artist", a.slug), label: tx(a.name, locale) }))} /></section>}
          <section><h2 className="mb-3 font-display text-xl font-semibold">{t.common.artists}</h2><LinkChips items={artists.map((a) => ({ href: hrefFor(locale, "artist", a.slug), label: tx(a.name, locale) }))} empty={t.common.tbd} /></section>
          <section><h2 className="mb-3 font-display text-xl font-semibold">{t.common.genres}</h2><LinkChips items={l.genres.map((g) => atlas.genre(g)).filter((g): g is NonNullable<typeof g> => !!g).map((g) => ({ href: hrefFor(locale, "genre", g.slug), label: tx(g.name, locale) }))} empty={t.common.tbd} /></section>
        </div>
        <aside className="space-y-6">
          <KeyFacts items={[
            { label: t.common.founded, value: l.foundedYear ?? t.common.tbd },
            { label: t.common.city, value: l.city ? <a href={hrefFor(locale, "city", l.city)} className="text-cyan">{tx(atlas.city(l.city)?.name, locale)}</a> : t.common.tbd },
            { label: t.common.country, value: tx(atlas.country(l.country)?.name, locale) },
            { label: t.common.website, value: site ? <a href={site} target="_blank" rel="noopener noreferrer" className="text-cyan">{new URL(site).hostname}</a> : t.common.tbd },
          ]} />
          <SourcesList atlas={atlas} refs={l.sources} verification={l.verification} checkedAt={l.checkedAt} t={t} locale={locale} />
        </aside>
      </div>
    </>
  );
}
