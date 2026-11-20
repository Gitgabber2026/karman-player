/**
 * Реляционная модель Electronic Music World Atlas (PostgreSQL 16 + PostGIS 3).
 *
 * Принципы:
 *  - у каждой информационной сущности: uuid id, slug, локализованные name/summary,
 *    created_at / updated_at, verification + checked_at, связь с источниками (entity_sources);
 *  - геоточки хранятся как geometry(Point, 4326) + числовые lat/lng и точность координат;
 *  - постоянные сведения о фестивале (festivals) отделены от ежегодных выпусков (festival_editions);
 *  - связи многие-ко-многим — отдельные таблицы.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { LText, Release, Section } from "@/lib/types";

/** PostGIS geometry(Point, 4326). Значение пишется как EWKT 'SRID=4326;POINT(lng lat)'. */
export const point = customType<{ data: string; driverData: string }>({
  dataType() {
    return "geometry(Point, 4326)";
  },
});

export const verificationEnum = pgEnum("verification_status", ["verified", "unverified", "historical", "outdated", "unknown"]);
export const coordPrecisionEnum = pgEnum("coord_precision", ["address", "approximate", "city"]);
export const venueKindEnum = pgEnum("venue_kind", ["club", "concert-hall", "warehouse", "open-air", "festival-site", "cultural-center"]);
export const venueStatusEnum = pgEnum("venue_status", ["active", "closed", "historical", "relocated", "seasonal", "unknown"]);
export const festivalTypeEnum = pgEnum("festival_type", ["mega", "techno", "art-tech", "boutique", "hard-dance", "transformational", "city", "parade"]);
export const festivalStatusEnum = pgEnum("festival_status", ["active", "ended", "on-hiatus", "unknown"]);
export const eventStatusEnum = pgEnum("event_status", ["announced", "on-sale", "sold-out", "postponed", "cancelled", "completed"]);
export const eventCategoryEnum = pgEnum("event_category", [
  "club-night", "warehouse-rave", "underground-party", "open-air", "boat-party", "beach-party",
  "festival-afterparty", "dj-showcase", "label-night", "live-performance", "multi-day-rave",
]);
export const artistKindEnum = pgEnum("artist_kind", ["dj", "producer", "group", "live-act", "dj-producer"]);
export const genreFamilyEnum = pgEnum("genre_family", ["house", "techno", "trance", "bass", "hard-dance", "other"]);
export const genreRelationEnum = pgEnum("genre_relation", ["derived-from", "influenced-by", "fusion-of", "related"]);
export const roleEnum = pgEnum("user_role", ["admin", "editor", "researcher", "user"]);
export const favoriteKindEnum = pgEnum("favorite_kind", ["favorite", "visited", "saved"]);
export const entityTypeEnum = pgEnum("entity_type", ["continent", "country", "city", "venue", "festival", "edition", "event", "artist", "genre", "label", "era", "milestone", "route"]);
export const publishStateEnum = pgEnum("publish_state", ["draft", "review", "published", "unpublished"]);

/** Общие колонки информационной сущности */
const entityColumns = () => ({
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  nameRu: text("name_ru").notNull(),
  nameEn: text("name_en"),
  aliases: text("aliases").array().notNull().default(sql`'{}'::text[]`),
  summaryRu: text("summary_ru").notNull(),
  summaryEn: text("summary_en"),
  sections: jsonb("sections").$type<Section[]>().notNull().default([]),
  facts: jsonb("facts").$type<LText[]>().notNull().default([]),
  verification: verificationEnum("verification").notNull().default("unverified"),
  checkedAt: timestamp("checked_at", { withTimezone: true }),
  publishState: publishStateEnum("publish_state").notNull().default("published"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

const geoColumns = () => ({
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  coordPrecision: coordPrecisionEnum("coord_precision"),
  location: point("location"),
});

export const continents = pgTable("continents", {
  ...entityColumns(),
  centerLng: doublePrecision("center_lng").notNull(),
  centerLat: doublePrecision("center_lat").notNull(),
  zoom: doublePrecision("zoom").notNull(),
}, (t) => [uniqueIndex("continents_slug_idx").on(t.slug)]);

export const countries = pgTable("countries", {
  ...entityColumns(),
  continentId: uuid("continent_id").notNull().references(() => continents.id),
  iso2: text("iso2").notNull(),
  isoNumeric: text("iso_numeric").notNull(),
  centerLng: doublePrecision("center_lng").notNull(),
  centerLat: doublePrecision("center_lat").notNull(),
  zoom: doublePrecision("zoom").notNull(),
}, (t) => [uniqueIndex("countries_slug_idx").on(t.slug), uniqueIndex("countries_iso2_idx").on(t.iso2)]);

export const cities = pgTable("cities", {
  ...entityColumns(),
  ...geoColumns(),
  countryId: uuid("country_id").notNull().references(() => countries.id),
  isMusicCapital: boolean("is_music_capital").notNull().default(false),
}, (t) => [uniqueIndex("cities_slug_idx").on(t.slug), index("cities_location_gix").using("gist", t.location)]);

export const venues = pgTable("venues", {
  ...entityColumns(),
  ...geoColumns(),
  cityId: uuid("city_id").notNull().references(() => cities.id),
  kind: venueKindEnum("kind").notNull().default("club"),
  address: text("address"),
  openedYear: integer("opened_year"),
  closedYear: integer("closed_year"),
  status: venueStatusEnum("status").notNull().default("unknown"),
  legendary: boolean("legendary").notNull().default(false),
  residentNames: text("resident_names").array().notNull().default(sql`'{}'::text[]`),
  architecture: jsonb("architecture").$type<LText | null>(),
  soundSystem: jsonb("sound_system").$type<LText | null>(),
  capacity: integer("capacity"),
  website: text("website"),
  socials: jsonb("socials").$type<Record<string, string>>().notNull().default({}),
}, (t) => [uniqueIndex("venues_slug_idx").on(t.slug), index("venues_location_gix").using("gist", t.location), index("venues_city_idx").on(t.cityId)]);

export const festivals = pgTable("festivals", {
  ...entityColumns(),
  ...geoColumns(),
  cityId: uuid("city_id").notNull().references(() => cities.id),
  venueName: text("venue_name"),
  foundedYear: integer("founded_year"),
  endedYear: integer("ended_year"),
  status: festivalStatusEnum("status").notNull().default("unknown"),
  type: festivalTypeEnum("type").notNull(),
  usualMonths: integer("usual_months").array().notNull().default(sql`'{}'::integer[]`),
  usualDurationDays: integer("usual_duration_days"),
  attendance: jsonb("attendance").$type<LText | null>(),
  concept: jsonb("concept").$type<LText | null>(),
  website: text("website"),
}, (t) => [uniqueIndex("festivals_slug_idx").on(t.slug), index("festivals_location_gix").using("gist", t.location)]);

/** Конкретный ежегодный выпуск. Даты хранятся только подтверждённые. */
export const festivalEditions = pgTable("festival_editions", {
  id: uuid("id").primaryKey().defaultRandom(),
  festivalId: uuid("festival_id").notNull().references(() => festivals.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: eventStatusEnum("status").notNull(),
  verification: verificationEnum("verification").notNull().default("unverified"),
  checkedAt: timestamp("checked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("festival_editions_year_idx").on(t.festivalId, t.year)]);

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: text("external_id"),
  provider: text("provider").notNull().default("manual"),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  category: eventCategoryEnum("category").notNull(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }),
  cityId: uuid("city_id").references(() => cities.id),
  venueId: uuid("venue_id").references(() => venues.id),
  festivalEditionId: uuid("festival_edition_id").references(() => festivalEditions.id),
  venueName: text("venue_name").notNull(),
  address: text("address"),
  ...geoColumns(),
  organizer: text("organizer"),
  descriptionRu: text("description_ru"),
  descriptionEn: text("description_en"),
  ageRestriction: text("age_restriction"),
  price: text("price"),
  officialUrl: text("official_url").notNull(),
  imageUrl: text("image_url"),
  status: eventStatusEnum("status").notNull(),
  verification: verificationEnum("verification").notNull().default("unverified"),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull(),
  publishState: publishStateEnum("publish_state").notNull().default("review"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("events_slug_idx").on(t.slug), index("events_start_idx").on(t.startAt), uniqueIndex("events_provider_ext_idx").on(t.provider, t.externalId)]);

export const artists = pgTable("artists", {
  ...entityColumns(),
  realName: text("real_name"),
  kind: artistKindEnum("kind").notNull(),
  countryId: uuid("country_id").notNull().references(() => countries.id),
  cityId: uuid("city_id").references(() => cities.id),
  originNote: jsonb("origin_note").$type<LText | null>(),
  careerStartYear: integer("career_start_year"),
  releases: jsonb("releases").$type<Release[]>().notNull().default([]),
  website: text("website"),
}, (t) => [uniqueIndex("artists_slug_idx").on(t.slug)]);

/** Участники лайнапа события: ссылка на артиста или имя, если артиста нет в базе */
export const eventLineups = pgTable("event_lineups", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  artistId: uuid("artist_id").references(() => artists.id),
  artistName: text("artist_name").notNull(),
  billingOrder: integer("billing_order").notNull().default(0),
});

export const editionLineups = pgTable("edition_lineups", {
  editionId: uuid("edition_id").notNull().references(() => festivalEditions.id, { onDelete: "cascade" }),
  artistId: uuid("artist_id").notNull().references(() => artists.id),
}, (t) => [primaryKey({ columns: [t.editionId, t.artistId] })]);

export const genres = pgTable("genres", {
  ...entityColumns(),
  family: genreFamilyEnum("family").notNull(),
  parentId: uuid("parent_id"),
  originNote: jsonb("origin_note").$type<LText | null>(),
  periodStart: integer("period_start"),
  bpmMin: integer("bpm_min"),
  bpmMax: integer("bpm_max"),
  characteristics: jsonb("characteristics").$type<LText>().notNull(),
  rhythm: jsonb("rhythm").$type<LText | null>(),
  instruments: text("instruments").array().notNull().default(sql`'{}'::text[]`),
  keyArtistNames: text("key_artist_names").array().notNull().default(sql`'{}'::text[]`),
  keyReleases: jsonb("key_releases").$type<{ artist: string; title: string; year: number }[]>().notNull().default([]),
}, (t) => [uniqueIndex("genres_slug_idx").on(t.slug)]);

export const genreRelationships = pgTable("genre_relationships", {
  fromGenreId: uuid("from_genre_id").notNull().references(() => genres.id, { onDelete: "cascade" }),
  toGenreId: uuid("to_genre_id").notNull().references(() => genres.id, { onDelete: "cascade" }),
  type: genreRelationEnum("type").notNull(),
}, (t) => [primaryKey({ columns: [t.fromGenreId, t.toGenreId, t.type] })]);

export const recordLabels = pgTable("record_labels", {
  ...entityColumns(),
  cityId: uuid("city_id").references(() => cities.id),
  countryId: uuid("country_id").notNull().references(() => countries.id),
  foundedYear: integer("founded_year"),
  website: text("website"),
}, (t) => [uniqueIndex("record_labels_slug_idx").on(t.slug)]);

export const eras = pgTable("eras", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  nameRu: text("name_ru").notNull(),
  nameEn: text("name_en"),
  startYear: integer("start_year").notNull(),
  endYear: integer("end_year").notNull(),
  summaryRu: text("summary_ru").notNull(),
  summaryEn: text("summary_en"),
  contextRu: text("context_ru").notNull(),
  contextEn: text("context_en"),
  releases: jsonb("releases").$type<{ artist: string; title: string; year: number }[]>().notNull().default([]),
  /** Связи эпохи со сущностями: { cities: [...slugs], artists, venues, genres } */
  links: jsonb("links").$type<{ cities: string[]; artists: string[]; venues: string[]; genres: string[] }>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("eras_slug_idx").on(t.slug)]);

export const historicalMilestones = pgTable("historical_milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  year: integer("year").notNull(),
  eraId: uuid("era_id").notNull().references(() => eras.id),
  titleRu: text("title_ru").notNull(),
  titleEn: text("title_en"),
  summaryRu: text("summary_ru").notNull(),
  summaryEn: text("summary_en"),
  cityId: uuid("city_id").references(() => cities.id),
  ...geoColumns(),
  links: jsonb("links").$type<{ artists: string[]; genres: string[]; venues: string[] }>().notNull(),
  verification: verificationEnum("verification").notNull().default("historical"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("milestones_slug_idx").on(t.slug), index("milestones_year_idx").on(t.year)]);

export const musicRoutes = pgTable("music_routes", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  cityId: uuid("city_id").notNull().references(() => cities.id),
  nameRu: text("name_ru").notNull(),
  nameEn: text("name_en"),
  summaryRu: text("summary_ru").notNull(),
  summaryEn: text("summary_en"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("routes_slug_idx").on(t.slug)]);

export const routeStops = pgTable("route_stops", {
  id: uuid("id").primaryKey().defaultRandom(),
  routeId: uuid("route_id").notNull().references(() => musicRoutes.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  venueId: uuid("venue_id").references(() => venues.id),
  titleRu: text("title_ru").notNull(),
  descriptionRu: text("description_ru").notNull(),
  ...geoColumns(),
});

export const sources = pgTable("sources", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  publisher: text("publisher").notNull(),
  kind: text("kind").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Полиморфная связь «сущность ↔ источник» с пометкой, что подтверждает источник */
export const entitySources = pgTable("entity_sources", {
  entityType: entityTypeEnum("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  sourceId: text("source_id").notNull().references(() => sources.id),
  note: text("note"),
  checkedAt: timestamp("checked_at", { withTimezone: true }),
}, (t) => [primaryKey({ columns: [t.entityType, t.entityId, t.sourceId] })]);

/** Медиафайл всегда хранится вместе с автором, лицензией и источником */
export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: entityTypeEnum("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  url: text("url").notNull(),
  thumbUrl: text("thumb_url"),
  width: integer("width"),
  height: integer("height"),
  altRu: text("alt_ru").notNull(),
  altEn: text("alt_en"),
  captionRu: text("caption_ru"),
  captionEn: text("caption_en"),
  author: text("author").notNull(),
  license: text("license").notNull(),
  licenseUrl: text("license_url").notNull(),
  sourceUrl: text("source_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ——— связи многие-ко-многим ———
const m2m = (name: string, left: string, right: string, leftTable: any, rightTable: any) =>
  pgTable(name, {
    leftId: uuid(left).notNull().references(() => leftTable.id, { onDelete: "cascade" }),
    rightId: uuid(right).notNull().references(() => rightTable.id, { onDelete: "cascade" }),
  }, (t) => [primaryKey({ columns: [t.leftId, t.rightId] })]);

export const countryGenres = m2m("country_genres", "country_id", "genre_id", countries, genres);
export const cityGenres = m2m("city_genres", "city_id", "genre_id", cities, genres);
export const venueGenres = m2m("venue_genres", "venue_id", "genre_id", venues, genres);
export const venueResidents = m2m("venue_residents", "venue_id", "artist_id", venues, artists);
export const festivalGenres = m2m("festival_genres", "festival_id", "genre_id", festivals, genres);
export const festivalArtists = m2m("festival_artists", "festival_id", "artist_id", festivals, artists);
export const artistGenres = m2m("artist_genres", "artist_id", "genre_id", artists, genres);
export const artistLabels = m2m("artist_labels", "artist_id", "label_id", artists, recordLabels);
export const genreOriginCities = m2m("genre_origin_cities", "genre_id", "city_id", genres, cities);
export const genreKeyArtists = m2m("genre_key_artists", "genre_id", "artist_id", genres, artists);
export const genreLabels = m2m("genre_labels", "genre_id", "label_id", genres, recordLabels);
export const labelGenres = m2m("label_genres", "label_id", "genre_id", recordLabels, genres);
export const labelFounders = m2m("label_founders", "label_id", "artist_id", recordLabels, artists);
export const eventGenres = m2m("event_genres", "event_id", "genre_id", events, genres);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  role: roleEnum("role").notNull().default("user"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("users_email_idx").on(t.email)]);

export const favorites = pgTable("favorites", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  entityType: entityTypeEnum("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  kind: favoriteKindEnum("kind").notNull().default("favorite"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.entityType, t.entityId, t.kind] })]);

/** Журнал изменений админ-панели: кто, что и когда изменил */
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  userEmail: text("user_email").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityRef: text("entity_ref"),
  details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("audit_log_created_idx").on(t.createdAt), index("audit_log_entity_idx").on(t.entityType, t.entityRef)]);
