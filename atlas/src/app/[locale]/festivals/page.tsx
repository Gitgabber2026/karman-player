import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { pageContext } from "@/lib/page";
import { tx, hrefFor } from "@/lib/atlas";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EntityCard } from "@/components/entity-card";
import { Badge } from "@/components/ui/badge";
import { FilterForm } from "@/components/filter-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Фестивали / Festivals" };

export default async function Festivals({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { locale, t, atlas } = await pageContext(params);
  const sp = await searchParams;
  const list = atlas.d.festivals
    .filter((f) => (sp.country ? atlas.city(f.city)?.country === sp.country : true))
    .filter((f) => (sp.genre ? f.genres.includes(sp.genre) : true))
    .filter((f) => (sp.type ? f.type === sp.type : true))
    .filter((f) => (sp.month ? f.usualMonths.includes(Number(sp.month)) : true))
    .sort((a, b) => (a.foundedYear ?? 9999) - (b.foundedYear ?? 9999));
  const all = { value: "", label: t.common.all };
  const countries = atlas.d.countries.filter((c) => atlas.festivalsInCountry(c.slug).length);
  const genres = atlas.d.genres.filter((g) => atlas.festivalsWithGenre(g.slug).length);
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t.map.world, href: `/${locale}` }, { label: t.nav.festivals }]} />
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-semibold sm:text-6xl">{t.sections.festivals}</h1>
        <Link href={`/${locale}/festivals/calendar`} className="inline-flex items-center gap-2 rounded-full border border-cyan/50 px-4 py-2 text-sm text-cyan hover:bg-cyan/10"><CalendarDays className="h-4 w-4" />Festival Explorer</Link>
      </div>
      <p className="mt-4 max-w-3xl text-ink-2">{locale === "ru" ? "Постоянные сведения о фестивалях отделены от ежегодных выпусков: «традиционный месяц» — это исторический паттерн, а не дата следующего выпуска." : "Permanent festival data is kept separate from yearly editions; the usual month is a historical pattern, not the next date."}</p>
      <div className="mt-8">
        <FilterForm applyLabel={locale === "ru" ? "Применить" : "Apply"} resetLabel={t.common.reset} fields={[
          { name: "country", label: t.common.country, type: "select", value: sp.country, options: [all, ...countries.map((c) => ({ value: c.slug, label: tx(c.name, locale) }))] },
          { name: "genre", label: t.common.genre, type: "select", value: sp.genre, options: [all, ...genres.map((g) => ({ value: g.slug, label: tx(g.name, locale) }))] },
          { name: "type", label: t.common.type, type: "select", value: sp.type, options: [all, ...Object.entries(t.festivalType).map(([value, label]) => ({ value, label }))] },
          { name: "month", label: t.common.usualMonths, type: "select", value: sp.month, options: [all, ...t.months.map((m, i) => ({ value: String(i + 1), label: m }))] },
        ]} />
      </div>
      <p className="mt-6 font-mono text-xs text-ink-3">{t.common.results}: {list.length}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((f) => (
          <EntityCard key={f.slug} href={hrefFor(locale, "festival", f.slug)} title={tx(f.name, locale)} kindLabel={t.festivalType[f.type]} seed={f.slug}
            subtitle={`${tx(atlas.city(f.city)?.name, locale)} · ${f.foundedYear ?? "—"}${f.endedYear ? `–${f.endedYear}` : ""}`} meta={tx(f.summary, locale)}
            badges={<>
              <Badge tone="cyan">{t.festivalType[f.type]}</Badge>
              {f.status !== "active" && <Badge tone="violet">{t.festivalStatus[f.status]}</Badge>}
              {f.usualMonths.length > 0 && <Badge>{f.usualMonths.map((m) => t.months[m - 1].slice(0, 3)).join(" / ")}</Badge>}
            </>} />
        ))}
      </div>
    </div>
  );
}
