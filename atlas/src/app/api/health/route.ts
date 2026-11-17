import { NextResponse } from "next/server";
import { getAtlasState } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getAtlasState();
  const d = s.atlas.d;
  return NextResponse.json({
    ok: true,
    dataMode: s.mode,
    dbError: s.error ? "unavailable" : null,
    counts: { countries: d.countries.length, cities: d.cities.length, venues: d.venues.length, festivals: d.festivals.length, artists: d.artists.length, genres: d.genres.length, events: d.events.length },
    integrations: s.integrations.map((i) => ({ id: i.id, state: i.state })),
  });
}
