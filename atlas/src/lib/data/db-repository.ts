import { asc } from "drizzle-orm";
import type { Db } from "@/db/client";
import * as s from "@/db/schema";
import type { AtlasData, Coordinates, EntityType, LText, SourceRef, VerificationStatus } from "@/lib/types";

const lt = (ru: string, en: string | null | undefined): LText => (en ? { ru, en } : { ru });
const coords = (r: { lat: number | null; lng: number | null; coordPrecision: Coordinates["precision"] | null }): Coordinates | null =>
  r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng, precision: r.coordPrecision ?? "approximate" } : null;
const iso = (d: Date | null) => (d ? d.toISOString() : null);

/**
 * Загружает опубликованное содержимое атласа из PostgreSQL в доменную модель.
 * Набор данных атласа невелик (сотни записей), поэтому он читается целиком и
 * кэшируется на уровне приложения; поиск и фильтры работают поверх этого индекса.
 */
export async function loadAtlasFromDb(db: Db): Promise<AtlasData> {
  const [
    continents, countries, cities, venues, festivals, editions, events, lineups, artists, genres, rels, labels, eras, milestones,
    routes, stops, sources, entitySources, media,
    countryGenres, cityGenres, venueGenres, venueResidents, festivalGenres, festivalArtists, artistGenres, artistLabels,
    genreCities, genreArtists, genreLabels, labelGenres, labelFounders, editionLineups, eventGenres,
  ] = await Promise.all([
    db.select().from(s.continents),
    db.select().from(s.countries),
    db.select().from(s.cities),
    db.select().from(s.venues),
    db.select().from(s.festivals),
    db.select().from(s.festivalEditions),
    db.select().from(s.events).orderBy(asc(s.events.startAt)),
    db.select().from(s.eventLineups).orderBy(asc(s.eventLineups.billingOrder)),
    db.select().from(s.artists),
    db.select().from(s.genres),
    db.select().from(s.genreRelationships),
    db.select().from(s.recordLabels),
    db.select().from(s.eras).orderBy(asc(s.eras.startYear)),
    db.select().from(s.historicalMilestones).orderBy(asc(s.historicalMilestones.year)),
    db.select().from(s.musicRoutes),
    db.select().from(s.routeStops).orderBy(asc(s.routeStops.position)),
    db.select().from(s.sources),
    db.select().from(s.entitySources),
    db.select().from(s.mediaAssets),
    db.select().from(s.countryGenres), db.select().from(s.cityGenres), db.select().from(s.venueGenres), db.select().from(s.venueResidents),
    db.select().from(s.festivalGenres), db.select().from(s.festivalArtists), db.select().from(s.artistGenres), db.select().from(s.artistLabels),
    db.select().from(s.genreOriginCities), db.select().from(s.genreKeyArtists), db.select().from(s.genreLabels), db.select().from(s.labelGenres),
    db.select().from(s.labelFounders), db.select().from(s.editionLineups), db.select().from(s.eventGenres),
  ]);

  const slugOf = (rows: { id: string; slug: string }[]) => new Map(rows.map((r) => [r.id, r.slug]));
  const M = {
    continent: slugOf(continents), country: slugOf(countries), city: slugOf(cities), venue: slugOf(venues), festival: slugOf(festivals),
    artist: slugOf(artists), genre: slugOf(genres), label: slugOf(labels), era: slugOf(eras), milestone: slugOf(milestones),
  };
  const sl = (kind: keyof typeof M, id: string | null) => (id ? M[kind].get(id) ?? null : null);
  const group = (rows: { leftId: string; rightId: string }[], right: keyof typeof M) => {
    const out = new Map<string, string[]>();
    for (const r of rows) {
      const v = M[right].get(r.rightId);
      if (!v) continue;
      out.set(r.leftId, [...(out.get(r.leftId) ?? []), v]);
    }
    return (id: string) => out.get(id) ?? [];
  };
  const srcMap = new Map<string, SourceRef[]>();
  for (const es of entitySources) {
    const k = `${es.entityType}:${es.entityId}`;
    srcMap.set(k, [...(srcMap.get(k) ?? []), es.note ? { id: es.sourceId, note: es.note } : { id: es.sourceId }]);
  }
  const srcs = (type: EntityType, id: string) => srcMap.get(`${type}:${id}`) ?? [];
  const published = <T extends { publishState: string }>(xs: T[]) => xs.filter((x) => x.publishState === "published");
  const base = (type: EntityType, r: { id: string; slug: string; nameRu: string; nameEn: string | null; aliases: string[]; summaryRu: string; summaryEn: string | null; sections: any; facts: any; verification: VerificationStatus; checkedAt: Date | null }) => ({
    slug: r.slug,
    name: lt(r.nameRu, r.nameEn),
    aliases: r.aliases,
    summary: lt(r.summaryRu, r.summaryEn),
    sections: r.sections,
    facts: r.facts,
    verification: r.verification,
    checkedAt: iso(r.checkedAt),
    sources: srcs(type, r.id),
  });

  const gCountry = group(countryGenres, "genre"), gCity = group(cityGenres, "genre"), gVenue = group(venueGenres, "genre"), rVenue = group(venueResidents, "artist");
  const gFest = group(festivalGenres, "genre"), aFest = group(festivalArtists, "artist"), gArtist = group(artistGenres, "genre"), lArtist = group(artistLabels, "label");
  const cGenre = group(genreCities, "city"), aGenre = group(genreArtists, "artist"), lGenre = group(genreLabels, "label"), gLabel = group(labelGenres, "genre"), fLabel = group(labelFounders, "artist");
  const edLineup = new Map<string, string[]>();
  for (const r of editionLineups) {
    const a = M.artist.get(r.artistId);
    if (a) edLineup.set(r.editionId, [...(edLineup.get(r.editionId) ?? []), a]);
  }
  const evGenres = group(eventGenres, "genre");
  const cityById = new Map(cities.map((c) => [c.id, c]));
  const countryById = new Map(countries.map((c) => [c.id, c]));

  return {
    continents: continents.map((c) => ({ ...base("continent", c), slug: c.slug as any, center: [c.centerLng, c.centerLat], zoom: c.zoom })),
    countries: published(countries).map((c) => ({
      ...base("country", c), iso2: c.iso2, isoNumeric: c.isoNumeric, continent: sl("continent", c.continentId) as any, center: [c.centerLng, c.centerLat], zoom: c.zoom, genres: gCountry(c.id),
    })),
    cities: published(cities).map((c) => ({
      ...base("city", c), country: sl("country", c.countryId)!, coords: coords(c)!, capital: c.isMusicCapital, genres: gCity(c.id),
    })),
    venues: published(venues).map((v) => ({
      ...base("venue", v), kind: v.kind, city: sl("city", v.cityId)!, address: v.address, coords: coords(v), openedYear: v.openedYear, closedYear: v.closedYear,
      status: v.status, legendary: v.legendary, genres: gVenue(v.id), residents: rVenue(v.id), residentNames: v.residentNames,
      architecture: v.architecture ?? undefined, soundSystem: v.soundSystem ?? undefined, capacity: v.capacity, website: v.website, socials: v.socials,
    })),
    festivals: published(festivals).map((f) => ({
      ...base("festival", f), city: sl("city", f.cityId)!, venueName: f.venueName, coords: coords(f), foundedYear: f.foundedYear, endedYear: f.endedYear,
      status: f.status, type: f.type, genres: gFest(f.id), usualMonths: f.usualMonths, usualDurationDays: f.usualDurationDays, attendance: f.attendance,
      concept: f.concept ?? undefined, notableArtists: aFest(f.id), website: f.website,
    })),
    editions: editions.map((e) => ({
      festival: sl("festival", e.festivalId)!, year: e.year, startDate: e.startDate, endDate: e.endDate, status: e.status,
      lineup: edLineup.get(e.id) ?? [], sources: [], verification: e.verification, checkedAt: iso(e.checkedAt),
    })),
    events: published(events).map((e) => {
      const city = e.cityId ? cityById.get(e.cityId) : undefined;
      const country = city ? countryById.get(city.countryId) : undefined;
      return {
        id: e.id, title: e.title, category: e.category, startAt: e.startAt.toISOString(), endAt: iso(e.endAt), city: city?.slug ?? null,
        cityName: city?.nameRu ?? "", countryName: country?.nameRu ?? "", venueSlug: sl("venue", e.venueId), venueName: e.venueName, address: e.address,
        coords: coords(e), lineup: lineups.filter((l) => l.eventId === e.id).map((l) => l.artistName), genres: evGenres(e.id), organizer: e.organizer,
        description: e.descriptionRu, ageRestriction: e.ageRestriction, price: e.price, officialUrl: e.officialUrl, imageUrl: e.imageUrl, status: e.status,
        provider: e.provider === "ticketmaster" ? "ticketmaster" : "manual", verification: e.verification, checkedAt: e.checkedAt.toISOString(),
      };
    }),
    artists: published(artists).map((a) => ({
      ...base("artist", a), realName: a.realName, kind: a.kind, country: sl("country", a.countryId)!, city: sl("city", a.cityId), originNote: a.originNote ?? undefined,
      careerStartYear: a.careerStartYear, genres: gArtist(a.id), labels: lArtist(a.id), releases: a.releases, website: a.website,
    })),
    genres: published(genres).map((g) => ({
      ...base("genre", g), family: g.family, parent: sl("genre", g.parentId), originCities: cGenre(g.id), originNote: g.originNote ?? undefined, periodStart: g.periodStart,
      bpm: g.bpmMin != null && g.bpmMax != null ? [g.bpmMin, g.bpmMax] : null, characteristics: g.characteristics, rhythm: g.rhythm ?? undefined,
      instruments: g.instruments, keyArtists: aGenre(g.id), keyArtistNames: g.keyArtistNames, keyReleases: g.keyReleases, labels: lGenre(g.id),
    })),
    genreRelationships: rels.map((r) => ({ from: sl("genre", r.fromGenreId)!, to: sl("genre", r.toGenreId)!, type: r.type })),
    labels: published(labels).map((l) => ({
      ...base("label", l), city: sl("city", l.cityId), country: sl("country", l.countryId)!, foundedYear: l.foundedYear, founders: fLabel(l.id), genres: gLabel(l.id), website: l.website,
    })),
    eras: eras.map((e) => ({
      slug: e.slug, name: lt(e.nameRu, e.nameEn), startYear: e.startYear, endYear: e.endYear, summary: lt(e.summaryRu, e.summaryEn), context: lt(e.contextRu, e.contextEn),
      releases: e.releases, ...e.links,
    })),
    milestones: milestones.map((m) => ({
      slug: m.slug, year: m.year, era: sl("era", m.eraId)!, title: lt(m.titleRu, m.titleEn), summary: lt(m.summaryRu, m.summaryEn), city: sl("city", m.cityId),
      coords: coords(m), ...m.links, sources: srcs("milestone", m.id), verification: m.verification,
    })),
    routes: routes.map((r) => ({
      slug: r.slug, city: sl("city", r.cityId)!, name: lt(r.nameRu, r.nameEn), summary: lt(r.summaryRu, r.summaryEn),
      stops: stops.filter((st) => st.routeId === r.id).map((st) => ({ title: lt(st.titleRu, null), description: lt(st.descriptionRu, null), venue: sl("venue", st.venueId) ?? undefined, coords: coords(st)! })),
    })),
    sources: sources.map((x) => ({ id: x.id, title: x.title, url: x.url, publisher: x.publisher, kind: x.kind as any })),
    media: media.map((x) => {
      const kind = x.entityType as EntityType;
      const map = (M as Record<string, Map<string, string>>)[kind];
      return {
        id: x.id, entityType: kind, entitySlug: map?.get(x.entityId) ?? "", url: x.url, thumbUrl: x.thumbUrl ?? undefined, width: x.width ?? undefined, height: x.height ?? undefined,
        alt: lt(x.altRu, x.altEn), caption: x.captionRu ? lt(x.captionRu, x.captionEn) : undefined, author: x.author, license: x.license, licenseUrl: x.licenseUrl, sourceUrl: x.sourceUrl,
      };
    }),
  };
}
