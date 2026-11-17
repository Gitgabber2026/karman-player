import { Atlas } from "@/lib/atlas";
import { getSeed } from "@/data";
import { getDb } from "@/db/client";
import { loadAtlasFromDb } from "./db-repository";
import { fetchTicketmasterEvents, staticIntegrations, type IntegrationStatus } from "@/lib/integrations/ticketmaster";
import type { AtlasData } from "@/lib/types";

export type DataMode = "database" | "seed";

const TTL = 60_000;
export interface AtlasState { at: number; atlas: Atlas; mode: DataMode; integrations: IntegrationStatus[]; error?: string }
let cached: AtlasState | null = null;
let inflight: Promise<AtlasState> | null = null;

async function load(): Promise<AtlasState> {
  const db = getDb();
  let data: AtlasData;
  let mode: DataMode = "seed";
  let error: string | undefined;
  if (db) {
    try {
      data = await loadAtlasFromDb(db);
      mode = "database";
    } catch (e) {
      // БД недоступна: показываем встроенный набор и явно сообщаем об этом в интерфейсе
      error = e instanceof Error ? e.message : String(e);
      data = getSeed();
    }
  } else {
    data = getSeed();
  }
  const tm = await fetchTicketmasterEvents(data.cities);
  if (tm.events.length) data = { ...data, events: [...data.events, ...tm.events].sort((a, b) => a.startAt.localeCompare(b.startAt)) };
  return { at: Date.now(), atlas: new Atlas(data), mode, integrations: [tm.status, ...staticIntegrations], error };
}

/** Единая точка доступа к данным атласа (кэш 60 с). */
export async function getAtlasState(): Promise<AtlasState> {
  if (cached && Date.now() - cached.at < TTL) return cached;
  inflight ??= load().finally(() => (inflight = null));
  const state = await inflight;
  cached = state;
  return state;
}

export async function getAtlas(): Promise<Atlas> {
  return (await getAtlasState()).atlas;
}
