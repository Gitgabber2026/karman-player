import { pageContext } from "@/lib/page";
import { tx, hrefFor } from "@/lib/atlas";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EntityCard } from "@/components/entity-card";
import { Badge } from "@/components/ui/badge";
import { FilterForm } from "@/components/filter-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Клубы / Clubs" };

type SP = Promise<Record<string, string | undefined>>;

export default async function Clubs({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SP }) {
  const { locale, t, atlas } = await pageContext(params);
  const sp = await searchParams;
  const list = atlas.d.venues
    .filter((v) => (sp.country ? atlas.city(v.city)?.country === sp.country : true))
    .filter((v) => (sp.city ? v.city === sp.city : true))
    .filter((v) => (sp.genre ? v.genres.includes(sp.genre) : true))
    .filter((v) => (sp.status ? v.status === sp.status : true))
    .filter((v) => (sp.legendary === "1" ? v.legendary : true))
    .sort((a, b) => Number(b.legendary) - Number(a.legendary) || tx(a.name, locale).localeCompare(tx(b.name, locale)));
  const countriesWithVenues = atlas.d.countries.filter((c) => atlas.venuesInCountry(c.slug).length);
  const citiesWithVenues = atlas.d.cities.filter((c) => atlas.venuesIn(c.slug).length && (!sp.country || c.country === sp.country));
  const genresUsed = atlas.d.genres.filter((g) => atlas.venuesWithGenre(g.slug).length);
  const all = { value: "", label: t.common.all };
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t.map.world, href: `/${locale}` }, { label: t.nav.clubs }]} />
      <h1 className="mt-6 font-display text-4xl font-semibold sm:text-6xl">{sp.legendary === "1" ? t.sections.legendary : t.nav.clubs}</h1>
      <p className="mt-4 max-w-2xl text-ink-2">{locale === "ru" ? "Глобальная база клубов и площадок. Статус каждого объекта (действующий, закрытый, исторический) и точность координат указаны явно." : "A global database of clubs and venues with explicit status and coordinate precision."}</p>
      <div className="mt-8">
        <FilterForm applyLabel={locale === "ru" ? "Применить" : "Apply"} resetLabel={t.common.reset} fields={[
          { name: "country", label: t.common.country, type: "select", value: sp.country, options: [all, ...countriesWithVenues.map((c) => ({ value: c.slug, label: tx(c.name, locale) }))] },
          { name: "city", label: t.common.city, type: "select", value: sp.city, options: [all, ...citiesWithVenues.map((c) => ({ value: c.slug, label: tx(c.name, locale) }))] },
          { name: "genre", label: t.common.genre, type: "select", value: sp.genre, options: [all, ...genresUsed.map((g) => ({ value: g.slug, label: tx(g.name, locale) }))] },
          { name: "status", label: t.common.status, type: "select", value: sp.status, options: [all, ...Object.entries(t.venueStatus).map(([value, label]) => ({ value, label }))] },
          { name: "legendary", label: t.map.onlyLegendary, type: "checkbox", value: sp.legendary },
        ]} />
      </div>
      <p className="mt-6 font-mono text-xs text-ink-3">{t.common.results}: {list.length}</p>
      {list.length === 0 ? <p className="mt-6 text-ink-2">{t.common.nothing}</p> : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((v) => (
            <EntityCard key={v.slug} href={hrefFor(locale, "venue", v.slug)} title={tx(v.name, locale)} kindLabel={t.venueKind[v.kind]} seed={v.slug}
              subtitle={`${tx(atlas.city(v.city)?.name, locale)} · ${v.openedYear ?? "—"}${v.closedYear ? `–${v.closedYear}` : ""}`} meta={tx(v.summary, locale)}
              badges={<>
                <Badge tone={["active", "seasonal"].includes(v.status) ? "cyan" : v.status === "unknown" ? "neutral" : "violet"}>{t.venueStatus[v.status]}</Badge>
                {v.legendary && <Badge tone="acid">Legendary</Badge>}
              </>} />
          ))}
        </div>
      )}
    </div>
  );
}
