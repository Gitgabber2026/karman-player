import { z } from "zod";
import type { AtlasEvent, City, EventStatus } from "@/lib/types";
import { normalize } from "@/lib/search";

/**
 * Адаптер Ticketmaster Discovery API v2 (https://developer.ticketmaster.com).
 * Используется только официальный API с ключом из TICKETMASTER_API_KEY.
 * События не изменяются и не дополняются вымышленными данными:
 * всё, чего нет в ответе API, остаётся пустым.
 */
const TmEvent = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  dates: z.object({
    start: z.object({ localDate: z.string().optional(), dateTime: z.string().optional() }).partial(),
    end: z.object({ dateTime: z.string().optional() }).partial().optional(),
    status: z.object({ code: z.string() }).partial().optional(),
  }),
  images: z.array(z.object({ url: z.string(), width: z.number().optional(), ratio: z.string().optional() })).optional(),
  priceRanges: z.array(z.object({ min: z.number().optional(), max: z.number().optional(), currency: z.string().optional() })).optional(),
  ageRestrictions: z.object({ legalAgeEnforced: z.boolean().optional() }).partial().optional(),
  promoter: z.object({ name: z.string().optional() }).partial().optional(),
  info: z.string().optional(),
  _embedded: z
    .object({
      venues: z
        .array(
          z.object({
            name: z.string().optional(),
            city: z.object({ name: z.string() }).partial().optional(),
            country: z.object({ name: z.string(), countryCode: z.string() }).partial().optional(),
            address: z.object({ line1: z.string() }).partial().optional(),
            location: z.object({ latitude: z.string(), longitude: z.string() }).partial().optional(),
          })
        )
        .optional(),
      attractions: z.array(z.object({ name: z.string() })).optional(),
    })
    .partial()
    .optional(),
});
const TmResponse = z.object({ _embedded: z.object({ events: z.array(TmEvent) }).optional() });

export type IntegrationStatus =
  | { id: string; name: string; state: "connected"; checkedAt: string; count: number }
  | { id: string; name: string; state: "not-configured" | "unavailable" | "error"; detail: string };

const statusMap: Record<string, EventStatus> = {
  onsale: "on-sale",
  offsale: "announced",
  cancelled: "cancelled",
  canceled: "cancelled",
  postponed: "postponed",
  rescheduled: "postponed",
};

export function mapTicketmasterEvent(raw: unknown, cities: City[], now: Date): AtlasEvent | null {
  const p = TmEvent.safeParse(raw);
  if (!p.success) return null;
  const e = p.data;
  const startAt = e.dates.start.dateTime ?? (e.dates.start.localDate ? `${e.dates.start.localDate}T00:00:00Z` : null);
  if (!startAt) return null;
  const v = e._embedded?.venues?.[0];
  const cityName = v?.city?.name ?? "";
  const city = cities.find((c) => [c.name.ru, c.name.en ?? "", ...(c.aliases ?? [])].some((n) => n && normalize(n) === normalize(cityName)));
  const lat = v?.location?.latitude ? Number(v.location.latitude) : NaN;
  const lng = v?.location?.longitude ? Number(v.location.longitude) : NaN;
  const price = e.priceRanges?.[0];
  const image = e.images?.filter((i) => i.ratio === "16_9").sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0] ?? e.images?.[0];
  let status: EventStatus = statusMap[e.dates.status?.code ?? ""] ?? "announced";
  if (new Date(startAt) < now && status !== "cancelled" && status !== "postponed") status = "completed";
  return {
    id: `tm-${e.id}`,
    title: e.name,
    category: "live-performance",
    startAt: new Date(startAt).toISOString(),
    endAt: e.dates.end?.dateTime ?? null,
    city: city?.slug ?? null,
    cityName,
    countryName: v?.country?.name ?? "",
    venueSlug: null,
    venueName: v?.name ?? "",
    address: v?.address?.line1 ?? null,
    coords: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng, precision: "address" } : null,
    lineup: e._embedded?.attractions?.map((a) => a.name) ?? [],
    genres: [],
    organizer: e.promoter?.name ?? null,
    description: e.info ?? null,
    ageRestriction: e.ageRestrictions?.legalAgeEnforced ? "18+" : null,
    price: price?.min != null ? `${price.min}${price.max && price.max !== price.min ? `–${price.max}` : ""} ${price.currency ?? ""}`.trim() : null,
    officialUrl: e.url,
    imageUrl: image?.url ?? null,
    status,
    provider: "ticketmaster",
    verification: "verified",
    checkedAt: now.toISOString(),
  };
}

let cache: { at: number; events: AtlasEvent[]; status: IntegrationStatus } | null = null;
const TTL = 15 * 60 * 1000;

export async function fetchTicketmasterEvents(cities: City[], fetchImpl: typeof fetch = fetch): Promise<{ events: AtlasEvent[]; status: IntegrationStatus }> {
  const key = process.env.TICKETMASTER_API_KEY;
  const name = "Ticketmaster Discovery API";
  if (!key) return { events: [], status: { id: "ticketmaster", name, state: "not-configured", detail: "TICKETMASTER_API_KEY не задан" } };
  if (cache && Date.now() - cache.at < TTL) return cache;
  const now = new Date();
  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", key);
  url.searchParams.set("classificationName", "Electronic");
  url.searchParams.set("size", "100");
  url.searchParams.set("sort", "date,asc");
  url.searchParams.set("startDateTime", now.toISOString().replace(/\.\d{3}Z$/, "Z"));
  try {
    const res = await fetchImpl(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = TmResponse.parse(await res.json());
    const events = (json._embedded?.events ?? []).map((e) => mapTicketmasterEvent(e, cities, now)).filter((e): e is AtlasEvent => !!e);
    cache = { at: Date.now(), events, status: { id: "ticketmaster", name, state: "connected", checkedAt: now.toISOString(), count: events.length } };
    return cache;
  } catch (err) {
    return { events: [], status: { id: "ticketmaster", name, state: "error", detail: err instanceof Error ? err.message : String(err) } };
  }
}

/** Источники, для которых нет разрешённого способа интеграции — показываются честно. */
export const staticIntegrations: IntegrationStatus[] = [
  { id: "resident-advisor", name: "Resident Advisor", state: "unavailable", detail: "Публичного API для сторонних приложений нет; данные не собираются." },
  { id: "musicbrainz", name: "MusicBrainz", state: "unavailable", detail: "Адаптер запланирован (открытый API, лицензия CC0 для основных данных)." },
  { id: "wikidata", name: "Wikidata / Wikimedia Commons", state: "unavailable", detail: "Адаптер запланирован для координат и изображений с лицензиями; требует ручной проверки редактором." },
  { id: "discogs", name: "Discogs API", state: "unavailable", detail: "Адаптер запланирован; требует токен и соблюдения условий Discogs." },
];
