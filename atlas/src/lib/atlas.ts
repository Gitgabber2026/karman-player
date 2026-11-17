import type {
  AtlasData, AtlasEvent, Artist, City, Continent, Country, EntityType, Era, Festival, Genre, LText, Locale, MediaAsset, Milestone,
  MusicRoute, RecordLabel, Source, Venue,
} from "./types";
import { matchScore } from "./search";

export type SearchKind = "country" | "city" | "venue" | "festival" | "artist" | "genre" | "label" | "event" | "continent";

export interface SearchResult {
  kind: SearchKind;
  slug: string;
  title: string;
  subtitle: string;
  href: string;
  score: number;
}

export interface MapFeatureProps {
  id: string;
  kind: "city" | "venue" | "festival" | "milestone" | "event";
  slug: string;
  name: string;
  subtitle: string;
  href: string;
  genres: string; // через запятую — для фильтров MapLibre
  continent: string;
  country: string;
  city: string;
  status: string;
  legendary: boolean;
  startYear: number; // -1 если неизвестно
  endYear: number; // 9999 если продолжает существовать
  precision: string;
  weight: number;
}

export type MapFeature = GeoJSON.Feature<GeoJSON.Point, MapFeatureProps>;

export const tx = (t: LText | null | undefined, locale: Locale): string => (t ? (locale === "en" ? t.en ?? t.ru : t.ru) : "");

export const hrefFor = (locale: Locale, kind: SearchKind | "route" | "era", slug: string): string => {
  const base = `/${locale}`;
  switch (kind) {
    case "continent": return `${base}/continents/${slug}`;
    case "country": return `${base}/countries/${slug}`;
    case "city": return `${base}/cities/${slug}`;
    case "venue": return `${base}/clubs/${slug}`;
    case "festival": return `${base}/festivals/${slug}`;
    case "artist": return `${base}/artists/${slug}`;
    case "genre": return `${base}/genres/${slug}`;
    case "label": return `${base}/labels/${slug}`;
    case "event": return `${base}/events/${slug}`;
    case "route": return `${base}/routes/${slug}`;
    case "era": return `${base}/history#${slug}`;
  }
};

/** Индекс атласа: быстрые выборки и связи поверх AtlasData. */
export class Atlas {
  readonly d: AtlasData;
  private by: {
    continent: Map<string, Continent>; country: Map<string, Country>; city: Map<string, City>; venue: Map<string, Venue>;
    festival: Map<string, Festival>; artist: Map<string, Artist>; genre: Map<string, Genre>; label: Map<string, RecordLabel>;
    source: Map<string, Source>; route: Map<string, MusicRoute>;
  };

  constructor(d: AtlasData) {
    this.d = d;
    const idx = <T extends { slug: string }>(xs: T[]) => new Map(xs.map((x) => [x.slug, x]));
    this.by = {
      continent: idx(d.continents), country: idx(d.countries), city: idx(d.cities), venue: idx(d.venues), festival: idx(d.festivals),
      artist: idx(d.artists), genre: idx(d.genres), label: idx(d.labels), route: idx(d.routes),
      source: new Map(d.sources.map((s) => [s.id, s])),
    };
  }

  continent = (s: string) => this.by.continent.get(s);
  country = (s: string) => this.by.country.get(s);
  city = (s: string) => this.by.city.get(s);
  venue = (s: string) => this.by.venue.get(s);
  festival = (s: string) => this.by.festival.get(s);
  artist = (s: string) => this.by.artist.get(s);
  genre = (s: string) => this.by.genre.get(s);
  label = (s: string) => this.by.label.get(s);
  route = (s: string) => this.by.route.get(s);
  source = (id: string) => this.by.source.get(id);
  event = (id: string) => this.d.events.find((e) => e.id === id);

  sourcesOf = (refs: { id: string; note?: string }[]) =>
    refs.map((r) => ({ ...r, source: this.source(r.id) })).filter((r): r is { id: string; note?: string; source: Source } => !!r.source);

  countryOfCity = (citySlug: string | null) => (citySlug ? this.country(this.city(citySlug)?.country ?? "") : undefined);
  continentOfCountry = (countrySlug: string) => this.continent(this.country(countrySlug)?.continent ?? "");

  countriesIn = (continent: string) => this.d.countries.filter((c) => c.continent === continent);
  citiesIn = (country: string) => this.d.cities.filter((c) => c.country === country);
  capitals = () => this.d.cities.filter((c) => c.capital);
  venuesIn = (city: string) => this.d.venues.filter((v) => v.city === city);
  festivalsIn = (city: string) => this.d.festivals.filter((f) => f.city === city);
  venuesInCountry = (country: string) => this.d.venues.filter((v) => this.city(v.city)?.country === country);
  festivalsInCountry = (country: string) => this.d.festivals.filter((f) => this.city(f.city)?.country === country);
  artistsInCountry = (country: string) => this.d.artists.filter((a) => a.country === country);
  artistsInCity = (city: string) => this.d.artists.filter((a) => a.city === city);
  labelsInCity = (city: string) => this.d.labels.filter((l) => l.city === city);
  genresOriginIn = (city: string) => this.d.genres.filter((g) => g.originCities.includes(city));
  milestonesIn = (city: string) => this.d.milestones.filter((m) => m.city === city);
  milestonesInCountry = (country: string) => this.d.milestones.filter((m) => m.city && this.city(m.city)?.country === country);
  routesIn = (city: string) => this.d.routes.filter((r) => r.city === city);
  eventsIn = (city: string) => this.d.events.filter((e) => e.city === city);
  editionsOf = (festival: string) => this.d.editions.filter((e) => e.festival === festival).sort((a, b) => b.year - a.year);

  venuesWithGenre = (g: string) => this.d.venues.filter((v) => v.genres.includes(g));
  festivalsWithGenre = (g: string) => this.d.festivals.filter((f) => f.genres.includes(g));
  artistsWithGenre = (g: string) => this.d.artists.filter((a) => a.genres.includes(g) || this.genre(g)?.keyArtists.includes(a.slug));
  childGenres = (g: string) => this.d.genres.filter((x) => x.parent === g);
  relatedGenres = (g: string) =>
    this.d.genreRelationships
      .filter((r) => r.from === g || r.to === g)
      .map((r) => ({ type: r.type, direction: r.from === g ? ("out" as const) : ("in" as const), genre: this.genre(r.from === g ? r.to : r.from)! }))
      .filter((r) => r.genre);
  residenciesOf = (artist: string) => this.d.venues.filter((v) => v.residents.includes(artist));
  festivalsOfArtist = (artist: string) => this.d.festivals.filter((f) => f.notableArtists.includes(artist));
  artistsOfLabel = (label: string) => this.d.artists.filter((a) => a.labels.includes(label));
  erasOfGenre = (g: string) => this.d.eras.filter((e) => e.genres.includes(g));
  erasOfCity = (c: string) => this.d.eras.filter((e) => e.cities.includes(c));
  mediaOf = (type: EntityType, slug: string): MediaAsset[] => this.d.media.filter((m) => m.entityType === type && m.entitySlug === slug);

  /** Количество объектов по континенту — для раздела Explore by Continent и слоя мира */
  continentStats(continent: string) {
    const countries = new Set(this.countriesIn(continent).map((c) => c.slug));
    const inC = (city: string) => countries.has(this.city(city)?.country ?? "");
    return {
      countries: countries.size,
      cities: this.d.cities.filter((c) => countries.has(c.country)).length,
      clubs: this.d.venues.filter((v) => inC(v.city)).length,
      festivals: this.d.festivals.filter((f) => inC(f.city)).length,
      artists: this.d.artists.filter((a) => countries.has(a.country)).length,
    };
  }

  countryStats(country: string) {
    return {
      cities: this.citiesIn(country).length,
      clubs: this.venuesInCountry(country).length,
      festivals: this.festivalsInCountry(country).length,
      artists: this.artistsInCountry(country).length,
    };
  }

  // ——— Карта ———
  mapFeatures(locale: Locale): MapFeature[] {
    const out: MapFeature[] = [];
    const geoOf = (city: string) => {
      const c = this.city(city);
      const country = c ? this.country(c.country) : undefined;
      return { city: c?.slug ?? "", country: country?.slug ?? "", continent: country?.continent ?? "" };
    };
    for (const c of this.d.cities) {
      if (!c.capital) continue;
      const country = this.country(c.country);
      out.push(feature(c.coords.lng, c.coords.lat, {
        id: `city:${c.slug}`, kind: "city", slug: c.slug, name: tx(c.name, locale), subtitle: tx(country?.name, locale), href: hrefFor(locale, "city", c.slug),
        genres: c.genres.join(","), continent: country?.continent ?? "", country: c.country, city: c.slug, status: "active", legendary: false,
        startYear: -1, endYear: 9999, precision: c.coords.precision,
        weight: 1 + this.venuesIn(c.slug).length + this.festivalsIn(c.slug).length,
      }));
    }
    for (const v of this.d.venues) {
      if (!v.coords) continue;
      const g = geoOf(v.city);
      out.push(feature(v.coords.lng, v.coords.lat, {
        id: `venue:${v.slug}`, kind: "venue", slug: v.slug, name: tx(v.name, locale), subtitle: tx(this.city(v.city)?.name, locale), href: hrefFor(locale, "venue", v.slug),
        genres: v.genres.join(","), ...g, status: v.status, legendary: v.legendary, startYear: v.openedYear ?? -1, endYear: v.closedYear ?? 9999, precision: v.coords.precision, weight: v.legendary ? 3 : 2,
      }));
    }
    for (const f of this.d.festivals) {
      if (!f.coords) continue;
      const g = geoOf(f.city);
      out.push(feature(f.coords.lng, f.coords.lat, {
        id: `festival:${f.slug}`, kind: "festival", slug: f.slug, name: tx(f.name, locale), subtitle: tx(this.city(f.city)?.name, locale), href: hrefFor(locale, "festival", f.slug),
        genres: f.genres.join(","), ...g, status: f.status, legendary: false, startYear: f.foundedYear ?? -1, endYear: f.endedYear ?? 9999, precision: f.coords.precision, weight: 3,
      }));
    }
    for (const m of this.d.milestones) {
      if (!m.coords) continue;
      const g = m.city ? geoOf(m.city) : { city: "", country: "", continent: "" };
      out.push(feature(m.coords.lng, m.coords.lat, {
        id: `milestone:${m.slug}`, kind: "milestone", slug: m.slug, name: tx(m.title, locale), subtitle: String(m.year), href: `${hrefFor(locale, "era", m.era)}`,
        genres: m.genres.join(","), ...g, status: "historical", legendary: false, startYear: m.year, endYear: 9999, precision: m.coords.precision, weight: 1,
      }));
    }
    for (const e of this.d.events) {
      if (!e.coords) continue;
      const g = e.city ? geoOf(e.city) : { city: "", country: "", continent: "" };
      out.push(feature(e.coords.lng, e.coords.lat, {
        id: `event:${e.id}`, kind: "event", slug: e.id, name: e.title, subtitle: `${e.venueName} · ${e.startAt.slice(0, 10)}`, href: hrefFor(locale, "event", e.id),
        genres: e.genres.join(","), ...g, status: e.status, legendary: false, startYear: Number(e.startAt.slice(0, 4)), endYear: 9999, precision: e.coords.precision, weight: 1,
      }));
    }
    return out;
  }

  // ——— Поиск ———
  search(query: string, locale: Locale, opts: { kinds?: SearchKind[]; limit?: number } = {}): SearchResult[] {
    const q = query.trim();
    if (q.length < 2) return [];
    const results: SearchResult[] = [];
    const add = (kind: SearchKind, slug: string, names: string[], title: string, subtitle: string, href: string, boost = 0) => {
      if (opts.kinds && !opts.kinds.includes(kind)) return;
      const score = matchScore(q, names);
      if (score > 0) results.push({ kind, slug, title, subtitle, href, score: score + boost });
    };
    const names = (x: { name: LText; aliases?: string[] }) => [x.name.ru, x.name.en ?? "", ...(x.aliases ?? [])].filter(Boolean);
    for (const c of this.d.continents) add("continent", c.slug, names(c), tx(c.name, locale), "", hrefFor(locale, "continent", c.slug), 2);
    for (const c of this.d.countries) add("country", c.slug, [...names(c), c.iso2], tx(c.name, locale), tx(this.continent(c.continent)?.name, locale), hrefFor(locale, "country", c.slug), 3);
    for (const c of this.d.cities) add("city", c.slug, names(c), tx(c.name, locale), tx(this.country(c.country)?.name, locale), hrefFor(locale, "city", c.slug), c.capital ? 4 : 0);
    for (const v of this.d.venues) add("venue", v.slug, names(v), tx(v.name, locale), tx(this.city(v.city)?.name, locale), hrefFor(locale, "venue", v.slug), v.legendary ? 2 : 0);
    for (const f of this.d.festivals) add("festival", f.slug, names(f), tx(f.name, locale), tx(this.city(f.city)?.name, locale), hrefFor(locale, "festival", f.slug), 2);
    for (const a of this.d.artists) add("artist", a.slug, [...names(a), a.realName ?? ""].filter(Boolean), tx(a.name, locale), tx(this.country(a.country)?.name, locale), hrefFor(locale, "artist", a.slug), 1);
    for (const g of this.d.genres) add("genre", g.slug, names(g), tx(g.name, locale), g.bpm ? `${g.bpm[0]}–${g.bpm[1]} BPM` : "", hrefFor(locale, "genre", g.slug), 1);
    for (const l of this.d.labels) add("label", l.slug, names(l), tx(l.name, locale), tx(this.city(l.city ?? "")?.name ?? this.country(l.country)?.name, locale), hrefFor(locale, "label", l.slug));
    for (const e of this.d.events) add("event", e.id, [e.title, e.venueName, ...e.lineup], e.title, `${e.venueName} · ${e.startAt.slice(0, 10)}`, hrefFor(locale, "event", e.id));
    return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, opts.limit ?? 30);
  }

  // ——— Граф связей: Артист → Жанр → Город → Клуб → Фестиваль → Лейбл ———
  connections(rootKind: GraphKind, rootSlug: string, perColumn = 7): ConnectionGraph | null {
    const edges = this.allEdges();
    const key = (k: GraphKind, s: string) => `${k}:${s}`;
    const root = key(rootKind, rootSlug);
    const adj = new Map<string, Set<string>>();
    for (const [a, b] of edges) {
      if (!adj.has(a)) adj.set(a, new Set());
      if (!adj.has(b)) adj.set(b, new Set());
      adj.get(a)!.add(b);
      adj.get(b)!.add(a);
    }
    if (!adj.has(root) && !this.nodeLabel(rootKind, rootSlug)) return null;
    const depth = new Map<string, number>([[root, 0]]);
    let frontier = [root];
    for (let d = 1; d <= 2; d++) {
      const next: string[] = [];
      for (const n of frontier) for (const m of adj.get(n) ?? []) if (!depth.has(m)) { depth.set(m, d); next.push(m); }
      frontier = next;
    }
    const score = (n: string) => (depth.get(n) === 0 ? 1e9 : (3 - depth.get(n)!) * 100 + (adj.get(n)?.size ?? 0));
    const columns: ConnectionGraph["columns"] = GRAPH_ORDER.map((kind) => ({
      kind,
      nodes: [...depth.keys()]
        .filter((n) => n.startsWith(kind + ":"))
        .sort((a, b) => score(b) - score(a))
        .slice(0, perColumn)
        .map((id) => ({ id, kind, slug: id.slice(kind.length + 1), depth: depth.get(id)! })),
    }));
    const shown = new Set(columns.flatMap((c) => c.nodes.map((n) => n.id)));
    const shownEdges = edges.filter(([a, b]) => shown.has(a) && shown.has(b) && (depth.get(a)! <= 1 || depth.get(b)! <= 1));
    return { root, columns, edges: shownEdges.map(([from, to]) => ({ from, to })) };
  }

  nodeLabel(kind: GraphKind, slug: string): LText | undefined {
    switch (kind) {
      case "artist": return this.artist(slug)?.name;
      case "genre": return this.genre(slug)?.name;
      case "city": return this.city(slug)?.name;
      case "venue": return this.venue(slug)?.name;
      case "festival": return this.festival(slug)?.name;
      case "label": return this.label(slug)?.name;
    }
  }

  private edgeCache: [string, string][] | null = null;
  private allEdges(): [string, string][] {
    if (this.edgeCache) return this.edgeCache;
    const e: [string, string][] = [];
    const push = (a: string, b: string | null | undefined) => { if (b) e.push([a, b]); };
    for (const a of this.d.artists) {
      const k = `artist:${a.slug}`;
      a.genres.forEach((g) => push(k, `genre:${g}`));
      a.labels.forEach((l) => push(k, `label:${l}`));
      if (a.city) push(k, `city:${a.city}`);
    }
    for (const v of this.d.venues) {
      const k = `venue:${v.slug}`;
      push(k, `city:${v.city}`);
      v.genres.forEach((g) => push(k, `genre:${g}`));
      v.residents.forEach((a) => push(`artist:${a}`, k));
    }
    for (const f of this.d.festivals) {
      const k = `festival:${f.slug}`;
      push(k, `city:${f.city}`);
      f.genres.forEach((g) => push(k, `genre:${g}`));
      f.notableArtists.forEach((a) => push(`artist:${a}`, k));
    }
    for (const g of this.d.genres) {
      const k = `genre:${g.slug}`;
      g.originCities.forEach((c) => push(k, `city:${c}`));
      g.labels.forEach((l) => push(k, `label:${l}`));
      g.keyArtists.forEach((a) => push(`artist:${a}`, k));
    }
    for (const l of this.d.labels) {
      const k = `label:${l.slug}`;
      if (l.city) push(k, `city:${l.city}`);
      l.founders.forEach((a) => push(`artist:${a}`, k));
    }
    const seen = new Set<string>();
    this.edgeCache = e.filter(([a, b]) => {
      const id = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    return this.edgeCache;
  }

  // ——— История ———
  /** Объекты, существование которых подтверждено к указанному году */
  existingIn(year: number) {
    return {
      venues: this.d.venues.filter((v) => v.openedYear != null && v.openedYear <= year && (v.closedYear == null || v.closedYear >= year)),
      festivals: this.d.festivals.filter((f) => f.foundedYear != null && f.foundedYear <= year && (f.endedYear == null || f.endedYear >= year)),
      milestones: this.d.milestones.filter((m) => m.year <= year),
      era: this.d.eras.filter((e) => e.startYear <= year && e.endYear >= year),
    };
  }

  eraOf = (slug: string): Era | undefined => this.d.eras.find((e) => e.slug === slug);
  milestonesOfEra = (slug: string): Milestone[] => this.d.milestones.filter((m) => m.era === slug).sort((a, b) => a.year - b.year);
}

export type GraphKind = "artist" | "genre" | "city" | "venue" | "festival" | "label";
export const GRAPH_ORDER: GraphKind[] = ["artist", "genre", "city", "venue", "festival", "label"];
export interface ConnectionGraph {
  root: string;
  columns: { kind: GraphKind; nodes: { id: string; kind: GraphKind; slug: string; depth: number }[] }[];
  edges: { from: string; to: string }[];
}

function feature(lng: number, lat: number, properties: MapFeatureProps): MapFeature {
  return { type: "Feature", geometry: { type: "Point", coordinates: [lng, lat] }, properties };
}

// ——— События: фильтрация по периоду ———
export type EventPeriod = "today" | "week" | "weekend" | "month" | "custom" | "upcoming" | "past";

export function periodRange(period: EventPeriod, now: Date, custom?: { from?: string; to?: string }): { from: Date; to: Date } {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const today = startOfDay(now);
  switch (period) {
    case "today": return { from: today, to: addDays(today, 1) };
    case "week": return { from: today, to: addDays(today, 7) };
    case "weekend": {
      const dow = today.getDay(); // 0 вс … 6 сб
      // Пятница 18:00 → понедельник 06:00 ближайших (или текущих) выходных
      const toFriday = dow === 0 ? -2 : dow === 6 ? -1 : 5 - dow;
      const friday = addDays(today, toFriday);
      const fridayEvening = new Date(friday.getFullYear(), friday.getMonth(), friday.getDate(), 18);
      const to = new Date(friday.getFullYear(), friday.getMonth(), friday.getDate() + 3, 6);
      // Если выходные уже идут, период начинается с сегодняшнего дня
      return { from: fridayEvening < today ? today : fridayEvening, to };
    }
    case "month": return { from: today, to: new Date(today.getFullYear(), today.getMonth() + 1, 1) };
    case "upcoming": return { from: now, to: new Date(8640000000000000) };
    case "past": return { from: new Date(0), to: now };
    case "custom": {
      const from = custom?.from ? new Date(custom.from + "T00:00:00") : today;
      const to = custom?.to ? addDays(new Date(custom.to + "T00:00:00"), 1) : addDays(from, 30);
      return { from, to };
    }
  }
}

export interface EventFilter {
  period?: EventPeriod;
  from?: string;
  to?: string;
  city?: string;
  country?: string;
  genre?: string;
  category?: string;
  status?: string;
}

export function filterEvents(events: AtlasEvent[], f: EventFilter, now: Date, cityToCountry: (city: string | null) => string | undefined): AtlasEvent[] {
  const { from, to } = periodRange(f.period ?? "upcoming", now, { from: f.from, to: f.to });
  return events
    .filter((e) => {
      const start = new Date(e.startAt);
      const end = e.endAt ? new Date(e.endAt) : start;
      if (end < from || start >= to) return false;
      if (f.city && e.city !== f.city) return false;
      if (f.country && cityToCountry(e.city) !== f.country) return false;
      if (f.genre && !e.genres.includes(f.genre)) return false;
      if (f.category && e.category !== f.category) return false;
      if (f.status && e.status !== f.status) return false;
      return true;
    })
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
}

// ——— Фестивальный календарь: только подтверждённые выпуски ———
export interface CalendarFilter {
  year?: number;
  month?: number;
  country?: string;
  city?: string;
  genre?: string;
  type?: string;
  confirmedOnly?: boolean;
}

export function festivalCalendar(atlas: Atlas, f: CalendarFilter) {
  const fests = atlas.d.festivals.filter((x) => {
    const city = atlas.city(x.city);
    if (f.country && city?.country !== f.country) return false;
    if (f.city && x.city !== f.city) return false;
    if (f.genre && !x.genres.includes(f.genre)) return false;
    if (f.type && x.type !== f.type) return false;
    return true;
  });
  const confirmed = atlas.d.editions
    .filter((e) => e.startDate && fests.some((x) => x.slug === e.festival))
    .filter((e) => (f.year ? e.year === f.year : true))
    .filter((e) => (f.month ? Number(e.startDate!.slice(5, 7)) === f.month : true));
  // «Традиционный месяц» — исторический паттерн; показывается отдельно и никогда не выдаётся за дату выпуска
  const typical = f.confirmedOnly
    ? []
    : fests.filter((x) => x.status !== "ended" && (f.month ? x.usualMonths.includes(f.month) : x.usualMonths.length > 0));
  return { confirmed, typical, festivals: fests };
}
