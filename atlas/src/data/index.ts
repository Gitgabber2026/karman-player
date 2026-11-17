import type { AtlasData } from "@/lib/types";
import { continents, countries } from "./geo";
import { cities } from "./cities";
import { venues } from "./venues";
import { festivals, editions } from "./festivals";
import { artists } from "./artists";
import { genres, genreRelationships } from "./genres";
import { labels } from "./labels";
import { eras, milestones, routes } from "./history";
import { allSources } from "./helpers";

/**
 * Встроенный seed-набор. Используется:
 *  1) скриптом `npm run db:seed` для наполнения PostgreSQL;
 *  2) как запасной источник данных, если DATABASE_URL не задан (режим разработки).
 *
 * events пуст намеренно: события не выдумываются. Реальные события
 * поступают из подключённых адаптеров (Ticketmaster) или вносятся редактором.
 * media пуст: проверенные изображения с лицензиями добавляются через
 * MediaAsset; до этого интерфейс показывает маркированные заглушки.
 */
export function getSeed(): AtlasData {
  return {
    continents,
    countries,
    cities,
    venues,
    festivals,
    editions,
    events: [],
    artists,
    genres,
    genreRelationships,
    labels,
    eras,
    milestones,
    routes,
    sources: allSources(),
    media: [],
  };
}
