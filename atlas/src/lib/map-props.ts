import type { Atlas } from "./atlas";
import { tx } from "./atlas";
import type { Dict } from "./i18n";
import type { Locale } from "./types";
import type { MapContinent, MapCountry, MapLabels } from "@/components/map/atlas-map";

export function mapProps(atlas: Atlas, locale: Locale, t: Dict) {
  const countries: MapCountry[] = atlas.d.countries.map((c) => ({
    slug: c.slug, iso: c.isoNumeric, name: tx(c.name, locale), continent: c.continent, center: c.center, zoom: c.zoom,
    summary: tx(c.summary, locale), stats: atlas.countryStats(c.slug),
  }));
  const continents: MapContinent[] = atlas.d.continents.map((c) => ({ slug: c.slug, name: tx(c.name, locale), center: c.center, zoom: c.zoom }));
  const labels: MapLabels = {
    ...t.map, genre: t.common.genre, all: t.common.all, explore: t.common.explore, reset: t.common.reset,
    statsClubs: t.common.clubs, statsFestivals: t.common.festivals, statsArtists: t.common.artists, statsCities: t.common.cities,
    precision: t.precision, kinds: { ...t.kinds },
  };
  const genres = atlas.d.genres.map((g) => ({ slug: g.slug, name: tx(g.name, locale) })).sort((a, b) => a.name.localeCompare(b.name));
  return { countries, continents, labels, genres, locale };
}
