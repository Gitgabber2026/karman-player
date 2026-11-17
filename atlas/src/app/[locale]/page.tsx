import Link from "next/link";
import { ArrowRight, Disc3, MapPin, Radio, Waves } from "lucide-react";
import { pageContext } from "@/lib/page";
import { tx, hrefFor, filterEvents } from "@/lib/atlas";
import { mapProps } from "@/lib/map-props";
import { AtlasMap } from "@/components/map/atlas-map";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeader } from "@/components/section-header";
import { EntityCard } from "@/components/entity-card";
import { Badge } from "@/components/ui/badge";
import { PlaceholderArt } from "@/components/placeholder-art";

export const dynamic = "force-dynamic";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t, atlas } = await pageContext(params);
  const mp = mapProps(atlas, locale, t);
  const d = atlas.d;
  const capitals = atlas.capitals();
  const legendary = d.venues.filter((v) => v.legendary);
  const greatFestivals = ["tomorrowland", "sonar", "awakenings", "movement-detroit", "time-warp", "dekmantel", "exit-festival", "boom-festival"]
    .map((s) => atlas.festival(s)).filter((f): f is NonNullable<typeof f> => !!f);
  const upcoming = filterEvents(d.events, { period: "upcoming" }, new Date(), (c) => atlas.countryOfCity(c)?.slug).slice(0, 6);
  const underground = ["berghain", "bassiani", "dc-10", "fuse", "tresor", "nowadays"].map((s) => atlas.venue(s)).filter((v): v is NonNullable<typeof v> => !!v);
  const families = ["house", "techno", "trance", "bass", "hard-dance", "other"] as const;
  const featured = ["jeff-mills", "carl-cox", "charlotte-de-witte", "black-coffee", "peggy-gou", "aphex-twin", "kraftwerk", "frankie-knuckles"]
    .map((s) => atlas.artist(s)).filter((a): a is NonNullable<typeof a> => !!a);
  const stats = [
    [d.countries.length, t.common.countries], [d.cities.length, t.common.cities], [d.venues.length, t.common.clubs],
    [d.festivals.length, t.common.festivals], [d.artists.length, t.common.artists], [d.genres.length, t.nav.genres],
  ] as const;

  return (
    <>
      {/* HERO: полноэкранная интерактивная карта */}
      <section className="relative h-[calc(100svh-4rem)] min-h-[620px]">
        <AtlasMap mode="hero" features={atlas.mapFeatures(locale)} {...mp} className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/70 via-transparent to-bg" />
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto max-w-[1440px] px-4 pt-10 sm:px-6 sm:pt-16 lg:px-8">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-cyan">Atlas · {d.countries.length} countries · {d.venues.length + d.festivals.length} places</p>
          <h1 className="max-w-5xl font-display text-[2.6rem] font-semibold leading-[0.95] tracking-tight sm:text-7xl lg:text-[6.5rem]">
            Electronic Music<br /><span className="bg-gradient-to-r from-ink via-cyan to-acid bg-clip-text text-transparent">World Atlas</span>
          </h1>
          <p className="mt-6 max-w-xl font-display text-base text-ink sm:text-xl">{t.tagline}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-2 sm:text-base">{t.heroText}</p>
          <div className="pointer-events-auto mt-8 flex flex-wrap gap-3">
            <ButtonLink href={`/${locale}/map`} variant="primary" size="lg">{t.ctaWorld} <ArrowRight className="h-4 w-4" /></ButtonLink>
            <ButtonLink href={`/${locale}/festivals`} variant="outline" size="lg">{t.ctaFestivals}</ButtonLink>
            <ButtonLink href={`/${locale}/genres`} variant="outline" size="lg">{t.ctaGenres}</ButtonLink>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto hidden max-w-[1440px] grid-cols-6 gap-px px-4 pb-6 sm:px-6 md:grid lg:px-8">
          {stats.map(([n, l]) => (
            <div key={l} className="border-l border-line-2 pl-4">
              <div className="font-display text-3xl font-semibold">{n}</div>
              <div className="text-xs uppercase tracking-wider text-ink-3">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] space-y-28 px-4 pt-20 sm:px-6 lg:px-8">
        {/* 1. Континенты */}
        <section>
          <SectionHeader index="01" title={t.sections.continents} href={`/${locale}/countries`} linkLabel={t.nav.countries} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.continents.map((c) => {
              const s = atlas.continentStats(c.slug);
              return (
                <Link key={c.slug} href={hrefFor(locale, "continent", c.slug)} className="group relative overflow-hidden rounded-2xl border border-line bg-card p-6 hover:border-line-2">
                  <PlaceholderArt seed={c.slug} label={tx(c.name, locale)} className="absolute inset-0 opacity-60" />
                  <div className="relative">
                    <h3 className="font-display text-2xl font-semibold group-hover:text-acid">{tx(c.name, locale)}</h3>
                    <p className="mt-2 line-clamp-3 max-w-md text-sm text-ink-2">{tx(c.summary, locale)}</p>
                    <div className="mt-6 flex gap-5 font-mono text-xs text-ink-2">
                      <span><b className="text-ink">{s.countries}</b> {t.common.countries.toLowerCase()}</span>
                      <span><b className="text-ink">{s.clubs}</b> {t.common.clubs.toLowerCase()}</span>
                      <span><b className="text-ink">{s.festivals}</b> {t.common.festivals.toLowerCase()}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 2. Столицы */}
        <section>
          <SectionHeader index="02" title={t.sections.capitals} kicker={locale === "ru" ? "Двадцать городов, каждый из которых — отдельная глава истории электронной музыки." : "Twenty cities, each a chapter in the history of electronic music."} href={`/${locale}/cities`} linkLabel={t.nav.cities} />
          <ol className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {capitals.map((c, i) => (
              <li key={c.slug} className="bg-bg">
                <Link href={hrefFor(locale, "city", c.slug)} className="group flex h-full flex-col gap-2 p-5 hover:bg-card">
                  <div className="flex items-center justify-between font-mono text-[11px] text-ink-3"><span>{String(i + 1).padStart(2, "0")}</span><span>{tx(atlas.country(c.country)?.name, locale)}</span></div>
                  <div className="font-display text-xl font-semibold group-hover:text-acid">{tx(c.name, locale)}</div>
                  <p className="line-clamp-3 text-sm text-ink-2">{tx(c.summary, locale)}</p>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* 3. Легендарные клубы */}
        <section>
          <SectionHeader index="03" title={t.sections.legendary} href={`/${locale}/clubs?legendary=1`} linkLabel={t.nav.clubs} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {legendary.slice(0, 8).map((v) => (
              <EntityCard key={v.slug} href={hrefFor(locale, "venue", v.slug)} title={tx(v.name, locale)} kindLabel={t.venueKind[v.kind]} seed={v.slug}
                subtitle={`${tx(atlas.city(v.city)?.name, locale)} · ${v.openedYear ?? "—"}${v.closedYear ? `–${v.closedYear}` : ""}`}
                badges={<Badge tone={v.status === "active" || v.status === "seasonal" ? "cyan" : "violet"}>{t.venueStatus[v.status]}</Badge>} />
            ))}
          </div>
        </section>

        {/* 4. Фестивали */}
        <section>
          <SectionHeader index="04" title={t.sections.festivals} href={`/${locale}/festivals`} linkLabel={t.nav.festivals} />
          <div className="grid gap-4 md:grid-cols-2">
            {greatFestivals.slice(0, 2).map((f) => (
              <EntityCard key={f.slug} aspect="aspect-[16/9]" href={hrefFor(locale, "festival", f.slug)} title={tx(f.name, locale)} kindLabel={t.festivalType[f.type]} seed={f.slug}
                subtitle={`${tx(atlas.city(f.city)?.name, locale)} · ${t.common.founded.toLowerCase()} ${f.foundedYear ?? "—"}`} meta={tx(f.summary, locale)} />
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {greatFestivals.slice(2).map((f) => (
              <EntityCard key={f.slug} href={hrefFor(locale, "festival", f.slug)} title={tx(f.name, locale)} kindLabel={t.festivalType[f.type]} seed={f.slug}
                subtitle={`${tx(atlas.city(f.city)?.name, locale)} · ${f.foundedYear ?? "—"}`} />
            ))}
          </div>
        </section>

        {/* 5. Ближайшие события */}
        <section>
          <SectionHeader index="05" title={t.sections.upcoming} href={`/${locale}/events`} linkLabel={t.nav.events} />
          {upcoming.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-2 p-8 text-center">
              <Radio className="mx-auto h-6 w-6 text-ink-3" aria-hidden />
              <p className="mx-auto mt-3 max-w-xl text-sm text-ink-2">
                {locale === "ru"
                  ? "Подтверждённых предстоящих событий в базе пока нет. Атлас не публикует вымышленные даты: события появляются после подключения Ticketmaster Discovery API или ручного добавления с официальным источником."
                  : "No confirmed upcoming events yet. The atlas never publishes invented dates: events appear once the Ticketmaster Discovery API is connected or an editor adds them with an official source."}
              </p>
              <Link href={`/${locale}/events`} className="mt-4 inline-block text-sm text-cyan hover:text-acid">{t.nav.events} →</Link>
            </div>
          ) : (
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {upcoming.map((e) => (
                <li key={e.id}><Link href={hrefFor(locale, "event", e.id)} className="flex items-center gap-4 p-4 hover:bg-card">
                  <span className="w-20 font-mono text-xs text-cyan">{e.startAt.slice(0, 10)}</span><span className="font-medium">{e.title}</span><span className="ml-auto text-sm text-ink-2">{e.venueName}, {e.cityName}</span>
                </Link></li>
              ))}
            </ul>
          )}
        </section>

        {/* 6. Андеграунд */}
        <section className="relative overflow-hidden rounded-3xl border border-line bg-bg-2 p-6 sm:p-10">
          <div className="grid-bg absolute inset-0 opacity-40" aria-hidden />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <div className="mb-2 font-mono text-xs text-cyan">06</div>
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t.sections.underground}</h2>
              <p className="prose-atlas mt-5">
                {locale === "ru"
                  ? "Андеграунд — это не жанр, а способ существования: пространства с собственными правилами, запретом на фотосъёмку, долгими сетами и сообществом, которое защищает танцпол. От бывших электростанций Берлина до бассейна под стадионом в Тбилиси."
                  : "Underground is not a genre but a way of being: spaces with their own rules, no-photo policies, long sets and communities that protect the dance floor."}
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {underground.map((v) => (
                <li key={v.slug}><Link href={hrefFor(locale, "venue", v.slug)} className="group block rounded-2xl border border-line bg-bg/70 p-4 hover:border-violet/60">
                  <div className="flex items-center gap-2 text-xs text-ink-3"><MapPin className="h-3 w-3" />{tx(atlas.city(v.city)?.name, locale)}</div>
                  <div className="mt-1 font-display text-lg group-hover:text-acid">{tx(v.name, locale)}</div>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-2">{tx(v.summary, locale)}</p>
                </Link></li>
              ))}
            </ul>
          </div>
        </section>

        {/* 7 + 10. Эволюция и хронология */}
        <section>
          <SectionHeader index="07" title={t.sections.evolution} href={`/${locale}/history`} linkLabel={t.nav.history} />
          <ol className="relative flex snap-x gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {d.eras.map((e) => (
              <li key={e.slug} className="w-72 shrink-0 snap-start">
                <Link href={hrefFor(locale, "era", e.slug)} className="group block h-full rounded-2xl border border-line bg-card p-5 hover:border-acid/50">
                  <div className="font-mono text-xs text-acid">{e.startYear}–{e.endYear}</div>
                  <div className="mt-2 font-display text-lg font-semibold leading-snug group-hover:text-acid">{tx(e.name, locale)}</div>
                  <p className="mt-2 line-clamp-3 text-sm text-ink-2">{tx(e.summary, locale)}</p>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* 8. Жанры */}
        <section>
          <SectionHeader index="08" title={t.sections.genres} href={`/${locale}/genres`} linkLabel={t.nav.genres} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {families.map((fam) => {
              const list = d.genres.filter((g) => g.family === fam);
              return (
                <div key={fam} className="rounded-2xl border border-line bg-card p-5">
                  <div className="flex items-center justify-between"><h3 className="font-display text-xl font-semibold">{t.family[fam]}</h3><Disc3 className="h-5 w-5 text-violet" aria-hidden /></div>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {list.map((g) => (
                      <li key={g.slug}><Link href={hrefFor(locale, "genre", g.slug)} className="inline-block rounded-full border border-line px-2.5 py-1 text-xs text-ink-2 hover:border-cyan hover:text-cyan">{tx(g.name, locale)}</Link></li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* 9. Артисты */}
        <section>
          <SectionHeader index="09" title={t.sections.artists} href={`/${locale}/artists`} linkLabel={t.nav.artists} />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((a) => (
              <EntityCard key={a.slug} aspect="aspect-square" href={hrefFor(locale, "artist", a.slug)} title={tx(a.name, locale)} kindLabel={t.artistKind[a.kind]} seed={a.slug}
                subtitle={tx(atlas.country(a.country)?.name, locale)} />
            ))}
          </div>
        </section>

        {/* Маршруты */}
        <section>
          <SectionHeader index="10" title={t.sections.routes} href={`/${locale}/routes`} linkLabel={t.nav.routes} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.routes.map((r) => (
              <Link key={r.slug} href={hrefFor(locale, "route", r.slug)} className="group flex items-start gap-4 rounded-2xl border border-line bg-card p-5 hover:border-line-2">
                <Waves className="mt-1 h-5 w-5 shrink-0 text-cyan" aria-hidden />
                <div><div className="font-display text-lg font-semibold group-hover:text-acid">{tx(r.name, locale)}</div><p className="mt-1 text-sm text-ink-2">{tx(r.summary, locale)}</p><div className="mt-2 font-mono text-xs text-ink-3">{r.stops.length} stops</div></div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
