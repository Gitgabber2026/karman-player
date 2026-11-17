/**
 * Доменная модель атласа. Одинакова для seed-набора и для данных из PostgreSQL:
 * репозиторий БД отображает строки таблиц в эти же структуры (см. src/lib/data).
 * Ссылки между сущностями — по slug, чтобы seed оставался читаемым.
 */

export type Locale = "ru" | "en";

/** Локализованная строка. Русский — основной язык, английский может отсутствовать. */
export interface LText {
  ru: string;
  en?: string;
}

/** Статус проверки данных (раздел 17 ТЗ). */
export type VerificationStatus = "verified" | "unverified" | "historical" | "outdated" | "unknown";

/**
 * Точность координат.
 * address — по известному адресу, требует сверки с OpenStreetMap;
 * approximate — район/участок, точка приблизительна;
 * city — используется центр города, точное место не установлено.
 */
export type CoordPrecision = "address" | "approximate" | "city";

export interface Coordinates {
  lat: number;
  lng: number;
  precision: CoordPrecision;
}

export interface Section {
  heading: LText;
  body: LText;
}

export interface SourceRef {
  /** id из каталога источников (src/data/sources.ts) */
  id: string;
  /** Что именно подтверждает источник */
  note?: string;
}

export interface BaseEntity {
  slug: string;
  name: LText;
  /** Альтернативные написания и транслитерации для поиска */
  aliases?: string[];
  summary: LText;
  sections?: Section[];
  facts?: LText[];
  sources: SourceRef[];
  verification: VerificationStatus;
  /** Дата последней редакционной проверки (ISO). null — ещё не проверялось. */
  checkedAt: string | null;
}

export type ContinentSlug =
  | "europe"
  | "north-america"
  | "south-america"
  | "asia"
  | "africa"
  | "oceania";

export interface Continent extends BaseEntity {
  slug: ContinentSlug;
  center: [number, number]; // [lng, lat]
  zoom: number;
}

export interface Country extends BaseEntity {
  iso2: string;
  /** ISO 3166-1 numeric — ключ полигона в world-atlas (Natural Earth) */
  isoNumeric: string;
  continent: ContinentSlug;
  center: [number, number];
  zoom: number;
  genres: string[];
}

export interface City extends BaseEntity {
  country: string;
  coords: Coordinates;
  /** Входит в список «музыкальных столиц» */
  capital: boolean;
  genres: string[];
}

export type VenueKind = "club" | "concert-hall" | "warehouse" | "open-air" | "festival-site" | "cultural-center";
export type VenueStatus = "active" | "closed" | "historical" | "relocated" | "seasonal" | "unknown";

export interface Venue extends BaseEntity {
  kind: VenueKind;
  city: string;
  address: string | null;
  coords: Coordinates | null;
  openedYear: number | null;
  closedYear: number | null;
  status: VenueStatus;
  /** Попадает в раздел Legendary Clubs */
  legendary: boolean;
  genres: string[];
  residents: string[]; // artist slugs
  residentNames?: string[]; // артисты, которых пока нет в базе
  architecture?: LText;
  soundSystem?: LText;
  capacity: number | null;
  website: string | null;
  socials?: Record<string, string>;
}

export type FestivalType =
  | "mega"
  | "techno"
  | "art-tech"
  | "boutique"
  | "hard-dance"
  | "transformational"
  | "city"
  | "parade";

export type FestivalStatus = "active" | "ended" | "on-hiatus" | "unknown";

export interface Festival extends BaseEntity {
  city: string;
  /** Площадка, если это постоянное место */
  venueName: string | null;
  coords: Coordinates | null;
  foundedYear: number | null;
  endedYear: number | null;
  status: FestivalStatus;
  type: FestivalType;
  genres: string[];
  /** Традиционные месяцы проведения (1–12) — исторический паттерн, НЕ даты выпуска */
  usualMonths: number[];
  usualDurationDays: number | null;
  attendance: LText | null;
  concept?: LText;
  notableArtists: string[]; // artist slugs, подтверждённые выступления в прошлом
  website: string | null;
}

export type EditionStatus = "announced" | "on-sale" | "sold-out" | "postponed" | "cancelled" | "completed";

/** Конкретный ежегодный выпуск фестиваля. Даты — только подтверждённые. */
export interface FestivalEdition {
  festival: string;
  year: number;
  startDate: string | null;
  endDate: string | null;
  status: EditionStatus;
  lineup: string[];
  sources: SourceRef[];
  verification: VerificationStatus;
  checkedAt: string | null;
}

export type EventCategory =
  | "club-night"
  | "warehouse-rave"
  | "underground-party"
  | "open-air"
  | "boat-party"
  | "beach-party"
  | "festival-afterparty"
  | "dj-showcase"
  | "label-night"
  | "live-performance"
  | "multi-day-rave";

export type EventStatus = "announced" | "on-sale" | "sold-out" | "postponed" | "cancelled" | "completed";

export interface AtlasEvent {
  id: string;
  title: string;
  category: EventCategory;
  startAt: string; // ISO
  endAt: string | null;
  city: string | null;
  cityName: string;
  countryName: string;
  venueSlug: string | null;
  venueName: string;
  address: string | null;
  coords: Coordinates | null;
  lineup: string[];
  genres: string[];
  organizer: string | null;
  description: string | null;
  ageRestriction: string | null;
  price: string | null;
  officialUrl: string;
  imageUrl: string | null;
  status: EventStatus;
  /** Откуда получено событие */
  provider: "manual" | "ticketmaster";
  verification: VerificationStatus;
  checkedAt: string;
}

export type ArtistKind = "dj" | "producer" | "group" | "live-act" | "dj-producer";

export interface Release {
  title: string;
  year: number;
  label?: string;
  kind: "album" | "single" | "ep" | "compilation" | "mix";
}

export interface Artist extends BaseEntity {
  realName: string | null;
  kind: ArtistKind;
  country: string; // country slug
  city: string | null; // city slug
  originNote?: LText; // уточнение происхождения, если города нет в базе
  careerStartYear: number | null;
  genres: string[];
  labels: string[]; // label slugs
  releases: Release[];
  website: string | null;
}

export type GenreFamily = "house" | "techno" | "trance" | "bass" | "hard-dance" | "other";

export interface Genre extends BaseEntity {
  family: GenreFamily;
  /** Родительский жанр в классификации (null для корней семейств) */
  parent: string | null;
  originCities: string[];
  originNote?: LText;
  periodStart: number | null; // год, приблизительно
  bpm: [number, number] | null;
  characteristics: LText;
  rhythm?: LText;
  instruments: string[];
  keyArtists: string[];
  keyArtistNames?: string[];
  keyReleases: { artist: string; title: string; year: number }[];
  labels: string[];
}

export type GenreRelationType = "derived-from" | "influenced-by" | "fusion-of" | "related";

export interface GenreRelationship {
  from: string;
  to: string;
  type: GenreRelationType;
}

export interface RecordLabel extends BaseEntity {
  city: string | null;
  country: string;
  foundedYear: number | null;
  founders: string[];
  genres: string[];
  website: string | null;
}

export interface Era {
  slug: string;
  name: LText;
  startYear: number;
  endYear: number;
  summary: LText;
  context: LText;
  cities: string[];
  artists: string[];
  venues: string[];
  genres: string[];
  releases: { artist: string; title: string; year: number }[];
}

export interface Milestone {
  slug: string;
  year: number;
  title: LText;
  summary: LText;
  era: string;
  city: string | null;
  coords: Coordinates | null;
  artists: string[];
  genres: string[];
  venues: string[];
  sources: SourceRef[];
  verification: VerificationStatus;
}

export interface RouteStop {
  title: LText;
  description: LText;
  venue?: string;
  coords: Coordinates;
}

export interface MusicRoute {
  slug: string;
  name: LText;
  summary: LText;
  city: string;
  stops: RouteStop[];
}

export interface Source {
  id: string;
  title: string;
  url: string;
  publisher: string;
  kind: "encyclopedia" | "official" | "press" | "database" | "book";
}

export type EntityType =
  | "continent"
  | "country"
  | "city"
  | "venue"
  | "festival"
  | "edition"
  | "event"
  | "artist"
  | "genre"
  | "label"
  | "era"
  | "milestone"
  | "route";

export interface MediaAsset {
  id: string;
  entityType: EntityType;
  entitySlug: string;
  url: string;
  thumbUrl?: string;
  width?: number;
  height?: number;
  alt: LText;
  caption?: LText;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
}

export interface AtlasData {
  continents: Continent[];
  countries: Country[];
  cities: City[];
  venues: Venue[];
  festivals: Festival[];
  editions: FestivalEdition[];
  events: AtlasEvent[];
  artists: Artist[];
  genres: Genre[];
  genreRelationships: GenreRelationship[];
  labels: RecordLabel[];
  eras: Era[];
  milestones: Milestone[];
  routes: MusicRoute[];
  sources: Source[];
  media: MediaAsset[];
}
