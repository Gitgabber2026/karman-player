import { describe, expect, it } from "vitest";
import { getSeed } from "@/data";
import { validateAtlas } from "@/lib/validate";
import { Atlas, filterEvents, festivalCalendar, periodRange } from "@/lib/atlas";
import { matchScore, phonetic } from "@/lib/search";
import { mapTicketmasterEvent } from "@/lib/integrations/ticketmaster";
import type { AtlasEvent } from "@/lib/types";

const atlas = new Atlas(getSeed());

describe("seed data", () => {
  it("is referentially consistent", () => expect(validateAtlas(atlas.d)).toEqual([]));
  it("contains no invented events or festival editions", () => {
    expect(atlas.d.events).toHaveLength(0);
    expect(atlas.d.editions.every((e) => e.sources.length > 0)).toBe(true);
  });
  it("has all 21 music capitals from the brief", () => expect(atlas.capitals()).toHaveLength(21));
});

describe("search", () => {
  it("handles transliteration and spelling variants", () => {
    expect(phonetic("Бергхайн")).toBe(phonetic("Berghain"));
    expect(atlas.search("бергхайн", "ru")[0].slug).toBe("berghain");
    expect(atlas.search("карл кокс", "ru")[0].slug).toBe("carl-cox");
    expect(atlas.search("трезор", "ru")[0].slug).toBe("tresor");
    expect(atlas.search("detroit", "en")[0].slug).toBe("detroit");
  });
  it("supports partial and fuzzy matches", () => {
    expect(matchScore("tomorr", ["Tomorrowland"])).toBeGreaterThan(0);
    expect(matchScore("tomorowland", ["Tomorrowland"])).toBeGreaterThan(0);
    expect(matchScore("zzzz", ["Tomorrowland"])).toBe(0);
  });
});

describe("map & history", () => {
  it("only maps objects with coordinates", () => {
    const f = atlas.mapFeatures("ru");
    expect(f.length).toBeGreaterThan(50);
    expect(f.some((x) => x.properties.slug === "rso-berlin")).toBe(false);
  });
  it("historical mode shows only confirmed existence", () => {
    const y1990 = atlas.existingIn(1990);
    expect(y1990.venues.some((v) => v.slug === "berghain")).toBe(false);
    expect(y1990.venues.some((v) => v.slug === "the-hacienda")).toBe(true);
    expect(atlas.existingIn(2000).venues.some((v) => v.slug === "the-hacienda")).toBe(false);
  });
  it("builds connection graph", () => {
    const g = atlas.connections("artist", "jeff-mills")!;
    expect(g.root).toBe("artist:jeff-mills");
    expect(g.columns.find((c) => c.kind === "genre")!.nodes.length).toBeGreaterThan(0);
  });
});

describe("events & calendar", () => {
  const ev = (id: string, startAt: string): AtlasEvent => ({ id, title: id, category: "club-night", startAt, endAt: null, city: "berlin", cityName: "Berlin", countryName: "", venueSlug: null, venueName: "X", address: null, coords: null, lineup: [], genres: ["techno"], organizer: null, description: null, ageRestriction: null, price: null, officialUrl: "https://example.org", imageUrl: null, status: "on-sale", provider: "manual", verification: "verified", checkedAt: startAt });
  const now = new Date(2026, 10, 17, 12); // вторник
  it("filters by period", () => {
    const list = [ev("a", new Date(2026, 10, 17, 23).toISOString()), ev("b", new Date(2026, 10, 21, 23).toISOString()), ev("c", new Date(2026, 11, 20).toISOString())];
    expect(filterEvents(list, { period: "today" }, now, () => "germany").map((e) => e.id)).toEqual(["a"]);
    expect(filterEvents(list, { period: "weekend" }, now, () => "germany").map((e) => e.id)).toEqual(["b"]);
    expect(filterEvents(list, { period: "month" }, now, () => "germany").map((e) => e.id)).toEqual(["a", "b"]);
    expect(filterEvents(list, { period: "upcoming", genre: "house" }, now, () => "germany")).toHaveLength(0);
  });
  it("weekend range starts Friday evening", () => {
    const r = periodRange("weekend", now);
    expect(r.from.getDay()).toBe(5);
    expect(r.from.getHours()).toBe(18);
  });
  it("never invents confirmed festival dates", () => {
    const cal = festivalCalendar(atlas, { month: 7 });
    expect(cal.confirmed).toHaveLength(0);
    expect(cal.typical.some((f) => f.slug === "tomorrowland")).toBe(true);
  });
});

describe("ticketmaster adapter", () => {
  it("maps API events without inventing fields", () => {
    const e = mapTicketmasterEvent({ id: "1", name: "Test", url: "https://tm.example/1", dates: { start: { dateTime: "2027-01-01T22:00:00Z" }, status: { code: "onsale" } }, _embedded: { venues: [{ name: "Club", city: { name: "Berlin" } }] } }, atlas.d.cities, new Date("2026-11-17"))!;
    expect(e.city).toBe("berlin");
    expect(e.status).toBe("on-sale");
    expect(e.price).toBeNull();
    expect(e.coords).toBeNull();
    expect(mapTicketmasterEvent({ bad: true }, atlas.d.cities, new Date())).toBeNull();
  });
});
