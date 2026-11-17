import { pageContext } from "@/lib/page";
import { tx, hrefFor } from "@/lib/atlas";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EntityCard } from "@/components/entity-card";
import { FilterForm } from "@/components/filter-form";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Артисты / Artists" };

export default async function Artists({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { locale, t, atlas } = await pageContext(params);
  const sp = await searchParams;
  const list = atlas.d.artists
    .filter((a) => (sp.country ? a.country === sp.country : true))
    .filter((a) => (sp.genre ? a.genres.includes(sp.genre) : true))
    .filter((a) => (sp.kind ? a.kind === sp.kind : true))
    .sort((a, b) => tx(a.name, locale).localeCompare(tx(b.name, locale)));
  const all = { value: "", label: t.common.all };
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t.map.world, href: `/${locale}` }, { label: t.nav.artists }]} />
      <h1 className="mt-6 font-display text-4xl font-semibold sm:text-6xl">{t.nav.artists}</h1>
      <p className="mt-4 max-w-3xl text-ink-2">{locale === "ru" ? "Биографии и дискографии — только подтверждаемые сведения. Полные дискографии подключаются через MusicBrainz (запланировано)." : "Biographies and discographies contain verifiable facts only. Full discographies will come via MusicBrainz."}</p>
      <div className="mt-8">
        <FilterForm applyLabel={locale === "ru" ? "Применить" : "Apply"} resetLabel={t.common.reset} fields={[
          { name: "country", label: t.common.country, type: "select", value: sp.country, options: [all, ...atlas.d.countries.filter((c) => atlas.artistsInCountry(c.slug).length).map((c) => ({ value: c.slug, label: tx(c.name, locale) }))] },
          { name: "genre", label: t.common.genre, type: "select", value: sp.genre, options: [all, ...atlas.d.genres.filter((g) => atlas.d.artists.some((a) => a.genres.includes(g.slug))).map((g) => ({ value: g.slug, label: tx(g.name, locale) }))] },
          { name: "kind", label: t.common.type, type: "select", value: sp.kind, options: [all, ...Object.entries(t.artistKind).map(([value, label]) => ({ value, label }))] },
        ]} />
      </div>
      <p className="mt-6 font-mono text-xs text-ink-3">{t.common.results}: {list.length}</p>
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {list.map((a) => (
          <EntityCard key={a.slug} aspect="aspect-square" href={hrefFor(locale, "artist", a.slug)} title={tx(a.name, locale)} kindLabel={t.artistKind[a.kind]} seed={a.slug}
            subtitle={tx(atlas.country(a.country)?.name, locale)} badges={a.genres.slice(0, 2).map((g) => <Badge key={g}>{tx(atlas.genre(g)?.name, locale)}</Badge>)} />
        ))}
      </div>
    </div>
  );
}
