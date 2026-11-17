import Link from "next/link";
import { pageContext } from "@/lib/page";
import { tx, hrefFor, festivalCalendar } from "@/lib/atlas";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FilterForm } from "@/components/filter-form";
import { fmtDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Festival Explorer" };

export default async function FestivalCalendar({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { locale, t, atlas } = await pageContext(params);
  const sp = await searchParams;
  const now = new Date();
  const year = sp.year ? Number(sp.year) : undefined;
  const month = sp.month ? Number(sp.month) : undefined;
  const cal = festivalCalendar(atlas, { year, month, country: sp.country, city: sp.city, genre: sp.genre, type: sp.type, confirmedOnly: sp.confirmed === "1" });
  const upcoming = cal.confirmed.filter((e) => e.endDate ? new Date(e.endDate) >= now : new Date(e.startDate!) >= now);
  const past = cal.confirmed.filter((e) => !upcoming.includes(e));
  const all = { value: "", label: t.common.all };
  const years = Array.from(new Set([now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1, ...atlas.d.editions.map((e) => e.year)])).sort();
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t.nav.festivals, href: `/${locale}/festivals` }, { label: "Festival Explorer" }]} />
      <h1 className="mt-6 font-display text-4xl font-semibold sm:text-6xl">Festival Explorer</h1>
      <p className="mt-4 max-w-3xl text-ink-2">{locale === "ru" ? "Календарь показывает только выпуски с подтверждёнными датами. Отдельно — традиционные месяцы проведения: это ориентир по истории фестиваля, а не анонс." : "The calendar lists only editions with confirmed dates. Usual months are shown separately as historical guidance, not announcements."}</p>
      <div className="mt-8">
        <FilterForm applyLabel={locale === "ru" ? "Применить" : "Apply"} resetLabel={t.common.reset} fields={[
          { name: "year", label: t.common.year, type: "select", value: sp.year, options: [all, ...years.map((y) => ({ value: String(y), label: String(y) }))] },
          { name: "month", label: t.common.month, type: "select", value: sp.month, options: [all, ...t.months.map((m, i) => ({ value: String(i + 1), label: m }))] },
          { name: "country", label: t.common.country, type: "select", value: sp.country, options: [all, ...atlas.d.countries.filter((c) => atlas.festivalsInCountry(c.slug).length).map((c) => ({ value: c.slug, label: tx(c.name, locale) }))] },
          { name: "genre", label: t.common.genre, type: "select", value: sp.genre, options: [all, ...atlas.d.genres.filter((g) => atlas.festivalsWithGenre(g.slug).length).map((g) => ({ value: g.slug, label: tx(g.name, locale) }))] },
          { name: "type", label: t.common.type, type: "select", value: sp.type, options: [all, ...Object.entries(t.festivalType).map(([value, label]) => ({ value, label }))] },
          { name: "confirmed", label: locale === "ru" ? "Только подтверждённые даты" : "Confirmed dates only", type: "checkbox", value: sp.confirmed },
        ]} />
      </div>

      <section className="mt-12">
        <h2 className="mb-4 font-display text-2xl font-semibold">{locale === "ru" ? "Подтверждённые выпуски" : "Confirmed editions"}</h2>
        {cal.confirmed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-warn/40 bg-warn/5 p-6 text-sm text-warn">
            {locale === "ru" ? "В базе нет выпусков с подтверждёнными датами для выбранных фильтров. Даты добавляются редактором только с официальным источником; даты прошлых лет не переносятся автоматически." : "No editions with confirmed dates for these filters. Editors add dates only with an official source; past dates are never carried over."}
          </div>
        ) : (
          <div className="space-y-6">
            {[[locale === "ru" ? "Предстоящие" : "Upcoming", upcoming], [locale === "ru" ? "Прошедшие" : "Past", past]].map(([label, list]) => (list as typeof upcoming).length > 0 && (
              <div key={label as string}>
                <h3 className="mb-2 text-xs uppercase tracking-widest text-ink-3">{label as string}</h3>
                <ul className="divide-y divide-line rounded-2xl border border-line">
                  {(list as typeof upcoming).map((e) => (
                    <li key={e.festival + e.year}><Link href={hrefFor(locale, "festival", e.festival)} className="flex flex-wrap gap-4 p-4 hover:bg-card"><span className="font-mono text-sm text-cyan">{fmtDate(e.startDate!, locale)}</span><span className="font-medium">{tx(atlas.festival(e.festival)?.name, locale)} {e.year}</span><span className="ml-auto text-sm text-ink-2">{t.eventStatus[e.status]}</span></Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {!sp.confirmed && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold">{locale === "ru" ? "Традиционный сезон" : "Usual season"}</h2>
          <p className="mb-6 mt-1 text-sm text-ink-3">{t.common.usualMonthsNote}</p>
          <div className="overflow-x-auto rounded-2xl border border-line scrollbar-thin">
            <table className="w-full min-w-[900px] text-sm">
              <thead><tr className="border-b border-line bg-bg-2">
                <th className="sticky left-0 bg-bg-2 p-3 text-left font-normal text-ink-3">{t.nav.festivals}</th>
                {t.months.map((m, i) => <th key={m} className={cn("p-2 text-center font-mono text-[11px] font-normal text-ink-3", month === i + 1 && "text-cyan")}>{m.slice(0, 3)}</th>)}
              </tr></thead>
              <tbody>
                {cal.typical.map((f) => (
                  <tr key={f.slug} className="border-b border-line/60 last:border-0">
                    <td className="sticky left-0 bg-bg p-3"><Link href={hrefFor(locale, "festival", f.slug)} className="hover:text-acid">{tx(f.name, locale)}</Link><span className="block text-xs text-ink-3">{tx(atlas.city(f.city)?.name, locale)}</span></td>
                    {t.months.map((_, i) => <td key={i} className="p-1.5 text-center">{f.usualMonths.includes(i + 1) && <span className="mx-auto block h-2.5 w-full rounded-full bg-gradient-to-r from-violet/70 to-cyan/70" title={t.months[i]} />}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
