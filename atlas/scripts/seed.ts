/**
 * Наполняет PostgreSQL проверочным seed-набором (src/data).
 * Идемпотентен: очищает таблицы атласа и вставляет данные заново.
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as s from "../src/db/schema";
import { getSeed } from "../src/data";
import { validateAtlas } from "../src/lib/validate";
import type { Coordinates, LText, SourceRef, EntityType } from "../src/lib/types";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL не задан. См. .env.example");
  process.exit(1);
}
const data = getSeed();
const issues = validateAtlas(data);
if (issues.length) {
  console.error("Seed-набор не прошёл проверку:", issues);
  process.exit(1);
}

const client = postgres(url, { max: 1 });
const db = drizzle(client, { schema: s });

const geo = (c: Coordinates | null) =>
  c ? { lat: c.lat, lng: c.lng, coordPrecision: c.precision, location: `SRID=4326;POINT(${c.lng} ${c.lat})` } : {};
const ent = (x: { slug: string; name: LText; aliases?: string[]; summary: LText; sections?: any[]; facts?: LText[]; verification: any; checkedAt: string | null }) => ({
  slug: x.slug,
  nameRu: x.name.ru,
  nameEn: x.name.en ?? null,
  aliases: x.aliases ?? [],
  summaryRu: x.summary.ru,
  summaryEn: x.summary.en ?? null,
  sections: x.sections ?? [],
  facts: x.facts ?? [],
  verification: x.verification,
  checkedAt: x.checkedAt ? new Date(x.checkedAt) : null,
});

async function main() {
  await client.unsafe(`TRUNCATE ${[
    "entity_sources", "sources", "media_assets", "route_stops", "music_routes", "historical_milestones", "eras",
    "event_genres", "event_lineups", "events", "edition_lineups", "festival_editions",
    "label_founders", "label_genres", "genre_labels", "genre_key_artists", "genre_origin_cities", "genre_relationships",
    "artist_labels", "artist_genres", "festival_artists", "festival_genres", "venue_residents", "venue_genres", "city_genres", "country_genres",
    "record_labels", "artists", "genres", "festivals", "venues", "cities", "countries", "continents",
  ].join(", ")} CASCADE`);

  const ids: Record<string, Map<string, string>> = {};
  const put = (kind: string, rows: { id: string; slug: string }[]) => {
    ids[kind] = new Map(rows.map((r) => [r.slug, r.id]));
  };
  const id = (kind: string, slug: string | null | undefined) => (slug ? ids[kind].get(slug)! : null);
  const entitySourceRows: { entityType: EntityType; entityId: string; sourceId: string; note: string | null }[] = [];
  const linkSources = (type: EntityType, kind: string, xs: { slug: string; sources: SourceRef[] }[]) => {
    for (const x of xs) for (const r of x.sources) entitySourceRows.push({ entityType: type, entityId: id(kind, x.slug)!, sourceId: r.id, note: r.note ?? null });
  };

  await db.insert(s.sources).values(data.sources);

  put("continent", await db.insert(s.continents).values(data.continents.map((c) => ({ ...ent(c), centerLng: c.center[0], centerLat: c.center[1], zoom: c.zoom }))).returning({ id: s.continents.id, slug: s.continents.slug }));
  put("country", await db.insert(s.countries).values(data.countries.map((c) => ({ ...ent(c), continentId: id("continent", c.continent)!, iso2: c.iso2, isoNumeric: c.isoNumeric, centerLng: c.center[0], centerLat: c.center[1], zoom: c.zoom }))).returning({ id: s.countries.id, slug: s.countries.slug }));
  put("city", await db.insert(s.cities).values(data.cities.map((c) => ({ ...ent(c), ...geo(c.coords), countryId: id("country", c.country)!, isMusicCapital: c.capital }))).returning({ id: s.cities.id, slug: s.cities.slug }));
  put("genre", await db.insert(s.genres).values(data.genres.map((g) => ({
    ...ent(g), family: g.family, originNote: g.originNote ?? null, periodStart: g.periodStart, bpmMin: g.bpm?.[0] ?? null, bpmMax: g.bpm?.[1] ?? null,
    characteristics: g.characteristics, rhythm: g.rhythm ?? null, instruments: g.instruments, keyArtistNames: g.keyArtistNames ?? [], keyReleases: g.keyReleases,
  }))).returning({ id: s.genres.id, slug: s.genres.slug }));
  for (const g of data.genres) if (g.parent) await client`UPDATE genres SET parent_id = ${id("genre", g.parent)} WHERE id = ${id("genre", g.slug)}`;
  put("venue", await db.insert(s.venues).values(data.venues.map((v) => ({
    ...ent(v), ...geo(v.coords), cityId: id("city", v.city)!, kind: v.kind, address: v.address, openedYear: v.openedYear, closedYear: v.closedYear, status: v.status,
    legendary: v.legendary, residentNames: v.residentNames ?? [], architecture: v.architecture ?? null, soundSystem: v.soundSystem ?? null, capacity: v.capacity, website: v.website, socials: v.socials ?? {},
  }))).returning({ id: s.venues.id, slug: s.venues.slug }));
  put("festival", await db.insert(s.festivals).values(data.festivals.map((f) => ({
    ...ent(f), ...geo(f.coords), cityId: id("city", f.city)!, venueName: f.venueName, foundedYear: f.foundedYear, endedYear: f.endedYear, status: f.status, type: f.type,
    usualMonths: f.usualMonths, usualDurationDays: f.usualDurationDays, attendance: f.attendance, concept: f.concept ?? null, website: f.website,
  }))).returning({ id: s.festivals.id, slug: s.festivals.slug }));
  put("artist", await db.insert(s.artists).values(data.artists.map((a) => ({
    ...ent(a), realName: a.realName, kind: a.kind, countryId: id("country", a.country)!, cityId: id("city", a.city), originNote: a.originNote ?? null, careerStartYear: a.careerStartYear, releases: a.releases, website: a.website,
  }))).returning({ id: s.artists.id, slug: s.artists.slug }));
  put("label", await db.insert(s.recordLabels).values(data.labels.map((l) => ({
    ...ent(l), cityId: id("city", l.city), countryId: id("country", l.country)!, foundedYear: l.foundedYear, website: l.website,
  }))).returning({ id: s.recordLabels.id, slug: s.recordLabels.slug }));

  const pairs = async (table: any, rows: [string | null, string | null][]) => {
    const vals = rows.filter(([a, b]) => a && b).map(([leftId, rightId]) => ({ leftId, rightId }));
    if (vals.length) await db.insert(table).values(vals).onConflictDoNothing();
  };
  await pairs(s.countryGenres, data.countries.flatMap((c) => c.genres.map((g) => [id("country", c.slug), id("genre", g)] as [string, string])));
  await pairs(s.cityGenres, data.cities.flatMap((c) => c.genres.map((g) => [id("city", c.slug), id("genre", g)] as [string, string])));
  await pairs(s.venueGenres, data.venues.flatMap((v) => v.genres.map((g) => [id("venue", v.slug), id("genre", g)] as [string, string])));
  await pairs(s.venueResidents, data.venues.flatMap((v) => v.residents.map((a) => [id("venue", v.slug), id("artist", a)] as [string, string])));
  await pairs(s.festivalGenres, data.festivals.flatMap((f) => f.genres.map((g) => [id("festival", f.slug), id("genre", g)] as [string, string])));
  await pairs(s.festivalArtists, data.festivals.flatMap((f) => f.notableArtists.map((a) => [id("festival", f.slug), id("artist", a)] as [string, string])));
  await pairs(s.artistGenres, data.artists.flatMap((a) => a.genres.map((g) => [id("artist", a.slug), id("genre", g)] as [string, string])));
  await pairs(s.artistLabels, data.artists.flatMap((a) => a.labels.map((l) => [id("artist", a.slug), id("label", l)] as [string, string])));
  await pairs(s.genreOriginCities, data.genres.flatMap((g) => g.originCities.map((c) => [id("genre", g.slug), id("city", c)] as [string, string])));
  await pairs(s.genreKeyArtists, data.genres.flatMap((g) => g.keyArtists.map((a) => [id("genre", g.slug), id("artist", a)] as [string, string])));
  await pairs(s.genreLabels, data.genres.flatMap((g) => g.labels.map((l) => [id("genre", g.slug), id("label", l)] as [string, string])));
  await pairs(s.labelGenres, data.labels.flatMap((l) => l.genres.map((g) => [id("label", l.slug), id("genre", g)] as [string, string])));
  await pairs(s.labelFounders, data.labels.flatMap((l) => l.founders.map((a) => [id("label", l.slug), id("artist", a)] as [string, string])));
  if (data.genreRelationships.length)
    await db.insert(s.genreRelationships).values(data.genreRelationships.map((r) => ({ fromGenreId: id("genre", r.from)!, toGenreId: id("genre", r.to)!, type: r.type })));

  put("era", await db.insert(s.eras).values(data.eras.map((e) => ({
    slug: e.slug, nameRu: e.name.ru, nameEn: e.name.en ?? null, startYear: e.startYear, endYear: e.endYear, summaryRu: e.summary.ru, summaryEn: e.summary.en ?? null,
    contextRu: e.context.ru, contextEn: e.context.en ?? null, releases: e.releases, links: { cities: e.cities, artists: e.artists, venues: e.venues, genres: e.genres },
  }))).returning({ id: s.eras.id, slug: s.eras.slug }));
  put("milestone", await db.insert(s.historicalMilestones).values(data.milestones.map((m) => ({
    slug: m.slug, year: m.year, eraId: id("era", m.era)!, titleRu: m.title.ru, titleEn: m.title.en ?? null, summaryRu: m.summary.ru, summaryEn: m.summary.en ?? null,
    cityId: id("city", m.city), ...geo(m.coords), links: { artists: m.artists, genres: m.genres, venues: m.venues }, verification: m.verification,
  }))).returning({ id: s.historicalMilestones.id, slug: s.historicalMilestones.slug }));
  for (const r of data.routes) {
    const [row] = await db.insert(s.musicRoutes).values({ slug: r.slug, cityId: id("city", r.city)!, nameRu: r.name.ru, nameEn: r.name.en ?? null, summaryRu: r.summary.ru, summaryEn: r.summary.en ?? null }).returning({ id: s.musicRoutes.id });
    await db.insert(s.routeStops).values(r.stops.map((st, i) => ({ routeId: row.id, position: i, venueId: id("venue", st.venue), titleRu: st.title.ru, descriptionRu: st.description.ru, ...geo(st.coords) })));
  }

  linkSources("country", "country", data.countries);
  linkSources("city", "city", data.cities);
  linkSources("venue", "venue", data.venues);
  linkSources("festival", "festival", data.festivals);
  linkSources("artist", "artist", data.artists);
  linkSources("genre", "genre", data.genres);
  linkSources("label", "label", data.labels);
  linkSources("continent", "continent", data.continents);
  linkSources("milestone", "milestone", data.milestones);
  if (entitySourceRows.length) await db.insert(s.entitySources).values(entitySourceRows).onConflictDoNothing();

  console.log(`✓ seeded: ${data.countries.length} countries, ${data.cities.length} cities, ${data.venues.length} venues, ${data.festivals.length} festivals, ${data.artists.length} artists, ${data.genres.length} genres, ${data.labels.length} labels, ${data.milestones.length} milestones, ${entitySourceRows.length} source links`);
}

main()
  .then(() => client.end())
  .catch(async (e) => {
    console.error(e);
    await client.end();
    process.exit(1);
  });
