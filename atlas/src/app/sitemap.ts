import type { MetadataRoute } from "next";
import { getAtlas } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const a = await getAtlas();
  const paths = [
    "", "/map", "/countries", "/clubs", "/festivals", "/festivals/calendar", "/events", "/genres", "/artists", "/labels", "/history", "/routes", "/connections", "/about",
    ...a.d.continents.map((x) => `/continents/${x.slug}`),
    ...a.d.countries.map((x) => `/countries/${x.slug}`),
    ...a.d.cities.map((x) => `/cities/${x.slug}`),
    ...a.d.venues.map((x) => `/clubs/${x.slug}`),
    ...a.d.festivals.map((x) => `/festivals/${x.slug}`),
    ...a.d.artists.map((x) => `/artists/${x.slug}`),
    ...a.d.genres.map((x) => `/genres/${x.slug}`),
    ...a.d.labels.map((x) => `/labels/${x.slug}`),
    ...a.d.routes.map((x) => `/routes/${x.slug}`),
  ];
  return paths.flatMap((p) => ["ru", "en"].map((l) => ({ url: `${site}/${l}${p}`, changeFrequency: "weekly" as const })));
}
