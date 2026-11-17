import { NextResponse } from "next/server";
import { getAtlas } from "@/lib/data";

/** GeoJSON всех объектов атласа с координатами */
export async function GET(req: Request) {
  const locale = new URL(req.url).searchParams.get("locale") === "en" ? "en" : "ru";
  const atlas = await getAtlas();
  return NextResponse.json(
    { type: "FeatureCollection", features: atlas.mapFeatures(locale) },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
  );
}
