import { NextResponse } from "next/server";
import { z } from "zod";
import { getAtlas } from "@/lib/data";

const Q = z.object({
  q: z.string().trim().min(1).max(100),
  locale: z.enum(["ru", "en"]).default("ru"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  kind: z.enum(["country", "city", "venue", "festival", "artist", "genre", "label", "event", "continent"]).optional(),
});

export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = Q.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: "invalid query", issues: parsed.error.issues }, { status: 400 });
  const { q, locale, limit, kind } = parsed.data;
  const atlas = await getAtlas();
  const results = atlas.search(q, locale, { limit, kinds: kind ? [kind] : undefined });
  return NextResponse.json({ q, results }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
}
