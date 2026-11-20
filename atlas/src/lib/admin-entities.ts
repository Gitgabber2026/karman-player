import type { Atlas } from "./atlas";
import type { BaseEntity, EntityType } from "./types";

export const ADMIN_KINDS = { venue: "Клубы", festival: "Фестивали", artist: "Артисты", city: "Города", country: "Страны", genre: "Жанры", label: "Лейблы" } as const;
export type AdminKind = keyof typeof ADMIN_KINDS;

export const isAdminKind = (k: string | undefined): k is AdminKind => !!k && k in ADMIN_KINDS;

export function entitiesOf(atlas: Atlas, kind: AdminKind): BaseEntity[] {
  const d = atlas.d;
  return { venue: d.venues, festival: d.festivals, artist: d.artists, city: d.cities, country: d.countries, genre: d.genres, label: d.labels }[kind];
}

export const asEntityType = (k: AdminKind): EntityType => k;
