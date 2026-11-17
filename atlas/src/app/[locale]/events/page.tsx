import Link from "next/link";
import { pageContext } from "@/lib/page";
import { tx, hrefFor, filterEvents, type EventPeriod } from "@/lib/atlas";
import { getAtlasState } from "@/lib/data";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FilterForm } from "@/components/filter-form";
import { Badge } from "@/components/ui/badge";
import { fmtDate, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "События / Events" };

const PERIODS: EventPeriod[] = ["today", "weekend", "week", "month", "upcoming", "past", "custom"];

export default async function Events({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { locale, t, atlas } = await pageContext(params);
  const state = await getAtlasState();
  const sp = await searchParams;
  const period = (PERIODS.includes(sp.period as EventPeriod) ? sp.period : "upcoming") as EventPeriod;
  const events = filterEvents(atlas.d.events, { ...sp, period }, new Date(), (c) => atlas.countryOfCity(c)?.slug);
  const all = { value: "", label: t.common.all };
  const qs = (p: EventPeriod) => {
    const u = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "period") as [string, string][]);
    u.set("period", p);
    return `?${u}`;
  };
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t.map.world, href: `/${locale}` }, { label: t.nav.events }]} />
      <h1 className="mt-6 font-display text-4xl font-semibold sm:text-6xl">{t.sections.upcoming}</h1>
      <p className="mt-4 max-w-3xl text-ink-2">{locale === "ru" ? "Клубные ночи, рейвы, open air и шоукейсы — только из подтверждённых источников. У каждого события есть ссылка на официальный источник и статус." : "Club nights, raves, open airs and showcases — from confirmed sources only."}</p>

      <nav className="mt-8 flex flex-wrap gap-2" aria-label="period">
        {PERIODS.filter((p) => p !== "custom").map((p) => (
          <Link key={p} href={qs(p)} className={cn("rounded-full border px-4 py-2 text-sm", period === p ? "border-cyan/60 bg-cyan/10 text-cyan" : "border-line text-ink-2 hover:text-ink")}>{t.periods[p]}</Link>
        ))}
      </nav>
      <div className="mt-4">
        <FilterForm applyLabel={locale === "ru" ? "Применить" : "Apply"} resetLabel={t.common.reset} hidden={{ period: sp.from || sp.to ? "custom" : period }} fields={[
          { name: "from", label: t.common.from, type: "date", value: sp.from },
          { name: "to", label: t.common.to, type: "date", value: sp.to },
          { name: "country", label: t.common.country, type: "select", value: sp.country, options: [all, ...atlas.d.countries.map((c) => ({ value: c.slug, label: tx(c.name, locale) }))] },
          { name: "city", label: t.common.city, type: "select", value: sp.city, options: [all, ...atlas.d.cities.map((c) => ({ value: c.slug, label: tx(c.name, locale) }))] },
          { name: "genre", label: t.common.genre, type: "select", value: sp.genre, options: [all, ...atlas.d.genres.map((g) => ({ value: g.slug, label: tx(g.name, locale) }))] },
          { name: "category", label: t.common.category, type: "select", value: sp.category, options: [all, ...Object.entries(t.eventCategory).map(([value, label]) => ({ value, label }))] },
          { name: "status", label: t.common.status, type: "select", value: sp.status, options: [all, ...Object.entries(t.eventStatus).map(([value, label]) => ({ value, label }))] },
        ]} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <section>
          <p className="mb-4 font-mono text-xs text-ink-3">{t.common.results}: {events.length}</p>
          {events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-2 p-8 text-sm leading-relaxed text-ink-2">
              {atlas.d.events.length === 0
                ? locale === "ru"
                  ? "В базе пока нет ни одного подтверждённого события. Атлас не публикует вымышленные мероприятия, даты, лайнапы и цены. События появятся после подключения Ticketmaster Discovery API (ключ в .env) или после добавления редактором с официальным источником."
                  : "There are no confirmed events in the database yet. The atlas never publishes invented events. They will appear once the Ticketmaster Discovery API is configured or an editor adds them with an official source."
                : t.common.nothing}
            </div>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
              {events.map((e) => (
                <li key={e.id}>
                  <Link href={hrefFor(locale, "event", e.id)} className="grid gap-2 p-4 hover:bg-card sm:grid-cols-[130px_1fr_auto] sm:items-center">
                    <div className="font-mono text-sm text-cyan">{fmtDate(e.startAt, locale, { day: "numeric", month: "short", year: "numeric" })}</div>
                    <div><div className="font-medium">{e.title}</div><div className="text-sm text-ink-2">{e.venueName} · {e.cityName}{e.countryName ? `, ${e.countryName}` : ""}</div></div>
                    <div className="flex gap-1.5"><Badge tone="cyan">{t.eventStatus[e.status]}</Badge><Badge>{e.provider}</Badge></div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <aside>
          <h2 className="mb-3 text-xs uppercase tracking-widest text-ink-3">{locale === "ru" ? "Источники событий" : "Event sources"}</h2>
          <ul className="space-y-2">
            {state.integrations.map((i) => (
              <li key={i.id} className="rounded-xl border border-line bg-bg-2 p-3 text-sm">
                <div className="flex items-center justify-between gap-2"><span>{i.name}</span>
                  <Badge tone={i.state === "connected" ? "acid" : i.state === "error" ? "danger" : "neutral"}>{i.state}</Badge></div>
                <p className="mt-1 text-xs text-ink-3">{i.state === "connected" ? `${i.count} · ${i.checkedAt.slice(0, 16).replace("T", " ")}` : i.detail}</p>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
