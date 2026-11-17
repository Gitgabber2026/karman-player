"use server";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import * as s from "@/db/schema";
import { clearSessionCookie, getSession, hasRole, setSessionCookie, verifyPassword, type Role } from "@/lib/auth";
import { invalidateAtlas } from "@/lib/data";

const loc = (fd: FormData) => (fd.get("locale") === "en" ? "en" : "ru");
const back = (fd: FormData, path: string, q: Record<string, string>) => redirect(`/${loc(fd)}/admin${path}?${new URLSearchParams(q)}`);

async function requireRole(min: Role) {
  const session = await getSession();
  if (!hasRole(session, min)) throw new Error("forbidden");
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL не задан");
  return { session: session!, db };
}

export async function login(fd: FormData) {
  const db = getDb();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!db) back(fd, "", { error: "db" });
  const [u] = await db!.select().from(s.users).where(eq(s.users.email, email)).limit(1);
  if (!u || u.role === "user" || !verifyPassword(password, u.passwordHash)) back(fd, "", { error: "auth" });
  await setSessionCookie({ userId: u.id, email: u.email, role: u.role });
  redirect(`/${loc(fd)}/admin`);
}

export async function logout(fd: FormData) {
  await clearSessionCookie();
  redirect(`/${loc(fd)}/admin`);
}

const httpsUrl = z.string().trim().url().refine((u) => /^https?:\/\//i.test(u), "http(s) only");
const opt = (x: z.ZodTypeAny) => z.preprocess((v) => (v === "" || v == null ? undefined : v), x.optional());

const EventInput = z.object({
  title: z.string().trim().min(3).max(200),
  category: z.enum(s.eventCategoryEnum.enumValues),
  status: z.enum(s.eventStatusEnum.enumValues),
  startAt: z.string().min(10),
  endAt: opt(z.string().min(10)),
  city: z.string().min(1),
  venue: opt(z.string()),
  venueName: z.string().trim().min(1).max(200),
  address: opt(z.string().max(300)),
  lat: opt(z.coerce.number().min(-90).max(90)),
  lng: opt(z.coerce.number().min(-180).max(180)),
  lineup: z.string().max(4000).default(""),
  organizer: opt(z.string().max(200)),
  description: opt(z.string().max(5000)),
  age: opt(z.string().max(20)),
  price: opt(z.string().max(100)),
  officialUrl: httpsUrl,
});

export async function createEvent(fd: FormData) {
  const { session, db } = await requireRole("researcher");
  const parsed = EventInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) back(fd, "/events/new", { error: parsed.error.issues.map((i) => i.path.join(".")).join(", ") });
  const e = parsed.data!;
  const start = new Date(e.startAt);
  const end = e.endAt ? new Date(e.endAt) : null;
  if (Number.isNaN(start.getTime()) || (end && end < start)) back(fd, "/events/new", { error: "dates" });
  const [city] = await db.select({ id: s.cities.id }).from(s.cities).where(eq(s.cities.slug, e.city)).limit(1);
  if (!city) back(fd, "/events/new", { error: "city" });
  const venue = e.venue ? (await db.select({ id: s.venues.id }).from(s.venues).where(eq(s.venues.slug, e.venue)).limit(1))[0] : undefined;
  const hasCoords = e.lat != null && e.lng != null;
  const editor = hasRole(session, "editor");
  const slug = `${e.title.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60)}-${start.toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 6)}`;
  const [row] = await db.insert(s.events).values({
    slug, title: e.title, category: e.category, status: e.status, startAt: start, endAt: end, cityId: city!.id, venueId: venue?.id ?? null,
    venueName: e.venueName, address: e.address ?? null, lat: hasCoords ? e.lat : null, lng: hasCoords ? e.lng : null,
    coordPrecision: hasCoords ? "address" : null, location: hasCoords ? `SRID=4326;POINT(${e.lng} ${e.lat})` : null,
    organizer: e.organizer ?? null, descriptionRu: e.description ?? null, ageRestriction: e.age ?? null, price: e.price ?? null,
    officialUrl: e.officialUrl, provider: "manual", checkedAt: new Date(),
    verification: editor ? "verified" : "unverified", publishState: editor ? "published" : "review",
  }).returning({ id: s.events.id });
  const names = e.lineup.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
  if (names.length) await db.insert(s.eventLineups).values(names.map((artistName, i) => ({ eventId: row.id, artistName, billingOrder: i })));
  const genres = fd.getAll("genres").map(String);
  if (genres.length) {
    const ids = await db.select({ id: s.genres.id, slug: s.genres.slug }).from(s.genres);
    const rows = ids.filter((g) => genres.includes(g.slug)).map((g) => ({ leftId: row.id, rightId: g.id }));
    if (rows.length) await db.insert(s.eventGenres).values(rows);
  }
  invalidateAtlas();
  back(fd, "", { ok: editor ? "event-published" : "event-review" });
}

const EditionInput = z.object({
  festival: z.string().min(1),
  year: z.coerce.number().int().min(1950).max(2100),
  startDate: opt(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: opt(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  status: z.enum(s.eventStatusEnum.enumValues),
  sourceUrl: httpsUrl,
  sourceTitle: z.string().trim().min(2).max(200),
});

/** Выпуск фестиваля можно создать только с официальным источником */
export async function createEdition(fd: FormData) {
  const { session, db } = await requireRole("researcher");
  const parsed = EditionInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) back(fd, "/editions/new", { error: parsed.error.issues.map((i) => i.path.join(".")).join(", ") });
  const e = parsed.data!;
  if (e.startDate && e.endDate && e.endDate < e.startDate) back(fd, "/editions/new", { error: "dates" });
  if (e.startDate && Number(e.startDate.slice(0, 4)) !== e.year) back(fd, "/editions/new", { error: "year" });
  const [f] = await db.select({ id: s.festivals.id }).from(s.festivals).where(eq(s.festivals.slug, e.festival)).limit(1);
  if (!f) back(fd, "/editions/new", { error: "festival" });
  const sourceId = `official:${e.sourceUrl}`;
  await db.insert(s.sources).values({ id: sourceId, title: e.sourceTitle, url: e.sourceUrl, publisher: new URL(e.sourceUrl).hostname, kind: "official" }).onConflictDoNothing();
  const [ed] = await db.insert(s.festivalEditions).values({
    festivalId: f!.id, year: e.year, startDate: e.startDate ?? null, endDate: e.endDate ?? null, status: e.status,
    verification: hasRole(session, "editor") ? "verified" : "unverified", checkedAt: new Date(),
  }).onConflictDoUpdate({
    target: [s.festivalEditions.festivalId, s.festivalEditions.year],
    set: { startDate: e.startDate ?? null, endDate: e.endDate ?? null, status: e.status, checkedAt: new Date(), updatedAt: new Date() },
  }).returning({ id: s.festivalEditions.id });
  await db.insert(s.entitySources).values({ entityType: "edition", entityId: ed.id, sourceId, checkedAt: new Date() }).onConflictDoNothing();
  invalidateAtlas();
  back(fd, "", { ok: "edition" });
}

export async function moderateEvent(fd: FormData) {
  const { db } = await requireRole("editor");
  const id = z.string().uuid().parse(fd.get("id"));
  const action = z.enum(["publish", "unpublish", "delete"]).parse(fd.get("action"));
  if (action === "delete") await db.delete(s.events).where(eq(s.events.id, id));
  else await db.update(s.events).set({ publishState: action === "publish" ? "published" : "unpublished", verification: action === "publish" ? "verified" : undefined, updatedAt: new Date() }).where(eq(s.events.id, id));
  invalidateAtlas();
  back(fd, "", { ok: action });
}

const TABLES = { country: s.countries, city: s.cities, venue: s.venues, festival: s.festivals, artist: s.artists, genre: s.genres, label: s.recordLabels } as const;

/** Редакционная проверка: смена статуса с фиксацией даты проверки */
export async function setVerification(fd: FormData) {
  const { db } = await requireRole("editor");
  const kind = z.enum(Object.keys(TABLES) as [keyof typeof TABLES, ...(keyof typeof TABLES)[]]).parse(fd.get("kind"));
  const slug = z.string().min(1).parse(fd.get("slug"));
  const status = z.enum(s.verificationEnum.enumValues).parse(fd.get("status"));
  const t = TABLES[kind];
  await db.update(t).set({ verification: status, checkedAt: sql`now()`, updatedAt: sql`now()` }).where(eq(t.slug, slug));
  invalidateAtlas();
  back(fd, "/verify", { ok: `${kind}:${slug}`, kind });
}
