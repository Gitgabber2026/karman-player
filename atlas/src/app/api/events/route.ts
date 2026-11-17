import { NextResponse } from "next/server";
import { z } from "zod";
import { getAtlas } from "@/lib/data";
import { filterEvents } from "@/lib/atlas";

const Q = z.object({
  period: z.enum(["today", "week", "weekend", "month", "custom", "upcoming", "past"]).default("upcoming"),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  city: z.string().max(80).optional(),
  country: z.string().max(80).optional(),
  genre: z.string().max(80).optional(),
  category: z.string().max(40).optional(),
  status: z.string().max(20).optional(),
});

export async function GET(req: Request) {
  const parsed = Q.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "invalid query" }, { status: 400 });
  const atlas = await getAtlas();
  const events = filterEvents(atlas.d.events, parsed.data, new Date(), (c) => atlas.countryOfCity(c)?.slug);
  return NextResponse.json({ count: events.length, events });
}
