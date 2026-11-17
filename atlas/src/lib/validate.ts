import type { AtlasData } from "./types";

export interface ValidationIssue {
  entity: string;
  slug: string;
  problem: string;
}

/** Проверка ссылочной целостности и базовых инвариантов набора данных. */
export function validateAtlas(d: AtlasData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const set = (xs: { slug: string }[]) => new Set(xs.map((x) => x.slug));
  const S = {
    continent: set(d.continents),
    country: set(d.countries),
    city: set(d.cities),
    venue: set(d.venues),
    festival: set(d.festivals),
    artist: set(d.artists),
    genre: set(d.genres),
    label: set(d.labels),
    era: set(d.eras),
  };
  const sourceIds = new Set(d.sources.map((s) => s.id));
  const need = (entity: string, slug: string, kind: keyof typeof S, refs: (string | null | undefined)[]) => {
    for (const r of refs) if (r && !S[kind].has(r)) issues.push({ entity, slug, problem: `unknown ${kind} "${r}"` });
  };
  const dupes = (entity: string, xs: { slug: string }[]) => {
    const seen = new Set<string>();
    for (const x of xs) {
      if (seen.has(x.slug)) issues.push({ entity, slug: x.slug, problem: "duplicate slug" });
      seen.add(x.slug);
    }
  };
  const coords = (entity: string, slug: string, c: { lat: number; lng: number } | null) => {
    if (c && (Math.abs(c.lat) > 90 || Math.abs(c.lng) > 180 || Number.isNaN(c.lat)))
      issues.push({ entity, slug, problem: "coordinates out of range" });
  };
  const srcs = (entity: string, slug: string, refs: { id: string }[]) => {
    for (const s of refs) if (!sourceIds.has(s.id)) issues.push({ entity, slug, problem: `unknown source ${s.id}` });
  };

  for (const [k, xs] of Object.entries({ continents: d.continents, countries: d.countries, cities: d.cities, venues: d.venues, festivals: d.festivals, artists: d.artists, genres: d.genres, labels: d.labels, eras: d.eras, milestones: d.milestones, routes: d.routes }))
    dupes(k, xs);

  for (const c of d.countries) { need("country", c.slug, "continent", [c.continent]); need("country", c.slug, "genre", c.genres); srcs("country", c.slug, c.sources); }
  for (const c of d.cities) { need("city", c.slug, "country", [c.country]); need("city", c.slug, "genre", c.genres); coords("city", c.slug, c.coords); srcs("city", c.slug, c.sources); }
  for (const v of d.venues) {
    need("venue", v.slug, "city", [v.city]); need("venue", v.slug, "genre", v.genres); need("venue", v.slug, "artist", v.residents);
    coords("venue", v.slug, v.coords); srcs("venue", v.slug, v.sources);
    if (v.closedYear && v.openedYear && v.closedYear < v.openedYear) issues.push({ entity: "venue", slug: v.slug, problem: "closed before opened" });
    if ((v.status === "closed" || v.status === "historical") && !v.closedYear) issues.push({ entity: "venue", slug: v.slug, problem: "closed venue without closedYear" });
  }
  for (const f of d.festivals) {
    need("festival", f.slug, "city", [f.city]); need("festival", f.slug, "genre", f.genres); need("festival", f.slug, "artist", f.notableArtists);
    coords("festival", f.slug, f.coords); srcs("festival", f.slug, f.sources);
    if (f.usualMonths.some((m) => m < 1 || m > 12)) issues.push({ entity: "festival", slug: f.slug, problem: "bad month" });
  }
  for (const e of d.editions) {
    need("edition", `${e.festival}-${e.year}`, "festival", [e.festival]);
    if (e.sources.length === 0) issues.push({ entity: "edition", slug: `${e.festival}-${e.year}`, problem: "edition without source" });
  }
  for (const a of d.artists) { need("artist", a.slug, "country", [a.country]); need("artist", a.slug, "city", [a.city]); need("artist", a.slug, "genre", a.genres); need("artist", a.slug, "label", a.labels); srcs("artist", a.slug, a.sources); }
  for (const g of d.genres) { need("genre", g.slug, "genre", [g.parent]); need("genre", g.slug, "city", g.originCities); need("genre", g.slug, "artist", g.keyArtists); need("genre", g.slug, "label", g.labels); srcs("genre", g.slug, g.sources);
    if (g.bpm && g.bpm[0] > g.bpm[1]) issues.push({ entity: "genre", slug: g.slug, problem: "bpm range inverted" }); }
  for (const r of d.genreRelationships) need("genre-relationship", `${r.from}->${r.to}`, "genre", [r.from, r.to]);
  for (const l of d.labels) { need("label", l.slug, "city", [l.city]); need("label", l.slug, "country", [l.country]); need("label", l.slug, "artist", l.founders); need("label", l.slug, "genre", l.genres); srcs("label", l.slug, l.sources); }
  for (const e of d.eras) { need("era", e.slug, "city", e.cities); need("era", e.slug, "artist", e.artists); need("era", e.slug, "venue", e.venues); need("era", e.slug, "genre", e.genres);
    if (e.endYear < e.startYear) issues.push({ entity: "era", slug: e.slug, problem: "era ends before start" }); }
  for (const m of d.milestones) { need("milestone", m.slug, "era", [m.era]); need("milestone", m.slug, "city", [m.city]); need("milestone", m.slug, "artist", m.artists); need("milestone", m.slug, "genre", m.genres); need("milestone", m.slug, "venue", m.venues); coords("milestone", m.slug, m.coords); srcs("milestone", m.slug, m.sources); }
  for (const r of d.routes) { need("route", r.slug, "city", [r.city]); for (const s of r.stops) { need("route", r.slug, "venue", [s.venue]); coords("route", r.slug, s.coords); } }
  for (const e of d.events) {
    if (!e.officialUrl) issues.push({ entity: "event", slug: e.id, problem: "event without official source" });
  }
  return issues;
}
