"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Map as MLMap, GeoJSONSource, MapGeoJSONFeature, Marker, Popup, StyleSpecification } from "maplibre-gl";
import { feature as topoFeature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";
import { Layers, SlidersHorizontal, History, X, ChevronRight, Search, Crosshair } from "lucide-react";
import type { MapFeature, MapFeatureProps } from "@/lib/atlas";
import { matchScore } from "@/lib/search";
import { cn } from "@/lib/utils";

export interface MapCountry {
  slug: string;
  iso: string;
  name: string;
  continent: string;
  center: [number, number];
  zoom: number;
  summary: string;
  stats: { cities: number; clubs: number; festivals: number; artists: number };
}
export interface MapContinent { slug: string; name: string; center: [number, number]; zoom: number }

export interface MapLabels {
  layers: string; cities: string; clubs: string; festivals: string; milestones: string; events: string; heatmap: string; countries: string;
  filters: string; onlyLegendary: string; onlyActive: string; historicalMode: string; yearHint: string; searchPlaceholder: string; world: string;
  loading: string; webglError: string; attribution: string; clickCountry: string; genre: string; all: string; explore: string; reset: string;
  statsClubs: string; statsFestivals: string; statsArtists: string; statsCities: string; precision: Record<string, string>; kinds: Record<string, string>;
}

type Kind = MapFeatureProps["kind"];
const KIND_COLOR: Record<Kind, string> = { city: "#F4F5F8", venue: "#9D4EDD", festival: "#00D9FF", milestone: "#B7FF39", event: "#FFB547" };
const DEFAULT_STYLE = process.env.NEXT_PUBLIC_MAP_STYLE_URL || "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "bg", type: "background", paint: { "background-color": "#070910" } }],
};

/** Полигоны, пересекающие 180-й меридиан (Россия, Фиджи), переносим в непрерывную долготу */
function fixAntimeridian(g: GeoJSON.Geometry) {
  const fixRing = (ring: number[][]) => {
    const lngs = ring.map((c) => c[0]);
    if (Math.max(...lngs) - Math.min(...lngs) > 180) for (const c of ring) if (c[0] < 0) c[0] += 360;
  };
  if (g.type === "Polygon") g.coordinates.forEach(fixRing);
  if (g.type === "MultiPolygon") g.coordinates.forEach((poly) => poly.forEach(fixRing));
}

async function resolveStyle(): Promise<{ style: StyleSpecification | string; remote: boolean }> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch(DEFAULT_STYLE, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) throw new Error(String(r.status));
    return { style: (await r.json()) as StyleSpecification, remote: true };
  } catch {
    return { style: FALLBACK_STYLE, remote: false };
  }
}

export function AtlasMap({
  features, countries, continents, labels, locale, mode = "full", initialView, genres = [], focusCountry, className, historicalYear,
}: {
  features: MapFeature[];
  countries: MapCountry[];
  continents: MapContinent[];
  labels: MapLabels;
  locale: "ru" | "en";
  mode?: "hero" | "full" | "city";
  initialView?: { center: [number, number]; zoom: number };
  genres?: { slug: string; name: string }[];
  focusCountry?: string;
  className?: string;
  /** Включает режим исторической карты с указанным годом */
  historicalYear?: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const clusterMarkers = useRef<Map<number, Marker>>(new Map());
  const popupRef = useRef<Popup | null>(null);
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [remoteBase, setRemoteBase] = useState(true);
  const [kinds, setKinds] = useState<Record<Kind, boolean>>({ city: true, venue: true, festival: true, milestone: mode === "full" || historicalYear != null, event: true });
  const [heat, setHeat] = useState(mode !== "city");
  const [genre, setGenre] = useState("");
  const [legendaryOnly, setLegendaryOnly] = useState(false);
  const [activeOnly, setActiveOnly] = useState(false);
  const [historical, setHistorical] = useState(historicalYear != null);
  const [year, setYear] = useState(historicalYear ?? 1991);
  const [panelOpen, setPanelOpen] = useState(mode === "full");
  const [selCountry, setSelCountry] = useState<MapCountry | null>(null);
  const [selCity, setSelCity] = useState<MapFeatureProps | null>(null);
  const [continent, setContinent] = useState<string>("");
  const [q, setQ] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => { if (window.innerWidth >= 1024) setFiltersOpen(true); }, []);

  const countryBySlug = useMemo(() => new Map(countries.map((c) => [c.slug, c])), [countries]);
  const countryByIso = useMemo(() => new Map(countries.map((c) => [c.iso, c])), [countries]);

  const filtered = useMemo(() => {
    return features.filter((f) => {
      const p = f.properties;
      if (!kinds[p.kind]) return false;
      if (genre && !p.genres.split(",").includes(genre)) return false;
      if (legendaryOnly && p.kind === "venue" && !p.legendary) return false;
      if (legendaryOnly && p.kind !== "venue") return false;
      if (activeOnly && ["closed", "historical", "ended"].includes(p.status)) return false;
      if (historical) {
        if (p.startYear === -1) return false;
        if (p.startYear > year || p.endYear < year) return false;
      }
      return true;
    });
  }, [features, kinds, genre, legendaryOnly, activeOnly, historical, year]);

  const searchHits = useMemo(() => {
    if (q.trim().length < 2) return [];
    return features
      .map((f) => ({ f, s: matchScore(q, [f.properties.name, f.properties.slug.replace(/-/g, " ")]) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 6)
      .map((x) => x.f);
  }, [q, features]);

  // ——— инициализация карты ———
  useEffect(() => {
    let disposed = false;
    let map: MLMap | null = null;
    (async () => {
      const [{ default: maplibregl }, { style, remote }] = await Promise.all([import("maplibre-gl"), resolveStyle()]);
      if (disposed || !container.current) return;
      setRemoteBase(remote);
      try {
        map = new maplibregl.Map({
          container: container.current,
          style,
          center: initialView?.center ?? [12, 28],
          zoom: initialView?.zoom ?? (mode === "hero" ? 1.35 : 1.6),
          minZoom: 1,
          maxZoom: 17,
          attributionControl: { compact: true, customAttribution: labels.attribution },
          cooperativeGestures: mode === "hero",
          dragRotate: false,
          renderWorldCopies: true,
        });
      } catch {
        setStatus("error");
        return;
      }
      mapRef.current = map;
      map.touchZoomRotate.disableRotation();
      if (mode !== "hero") map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      map.on("error", (e) => {
        // ошибки отдельных тайлов не должны ломать атлас
        if (process.env.NODE_ENV !== "production") console.warn("map error", e?.error?.message);
      });

      map.on("load", () => {
        if (!map) return;
        const world = topoFeature(worldTopo as any, (worldTopo as any).objects.countries) as unknown as GeoJSON.FeatureCollection;
        world.features = world.features.filter((f) => String(f.id) !== "010"); // Антарктида
        for (const f of world.features) {
          fixAntimeridian(f.geometry);
          const iso = String(f.id ?? "");
          const c = countryByIso.get(iso);
          f.properties = { iso, slug: c?.slug ?? "", name: c?.name ?? (f.properties as any)?.name ?? "", active: !!c };
        }
        map.addSource("countries", { type: "geojson", data: world, promoteId: "iso" });
        const firstSymbol = map.getStyle().layers?.find((l) => l.type === "symbol")?.id;
        map.addLayer({
          id: "countries-fill", type: "fill", source: "countries",
          paint: {
            "fill-color": ["case", ["boolean", ["feature-state", "selected"], false], "#00D9FF", ["get", "active"], "#9D4EDD", "#1a2030"],
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "selected"], false], 0.14,
              ["boolean", ["feature-state", "hover"], false], ["case", ["get", "active"], 0.22, 0.05],
              ["get", "active"], remote ? 0.06 : 0.16,
              remote ? 0 : 0.5,
            ],
          },
        }, firstSymbol);
        map.addLayer({
          id: "countries-line", type: "line", source: "countries",
          paint: {
            "line-color": ["case", ["boolean", ["feature-state", "selected"], false], "#00D9FF", ["get", "active"], "#5c3f8a", "#252b3d"],
            "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 1.4, 0.5],
            "line-opacity": remote ? 0.6 : 0.9,
          },
        }, firstSymbol);

        map.addSource("atlas", { type: "geojson", data: { type: "FeatureCollection", features: [] }, cluster: mode !== "city", clusterRadius: 42, clusterMaxZoom: 9 });
        map.addSource("atlas-heat", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({
          id: "heat", type: "heatmap", source: "atlas-heat", maxzoom: 9,
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 6, 1],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 0.6, 9, 2],
            "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(8,10,16,0)", 0.2, "rgba(157,78,221,0.35)", 0.5, "rgba(0,217,255,0.45)", 0.85, "rgba(183,255,57,0.6)", 1, "rgba(244,245,248,0.7)"],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 14, 6, 34, 9, 50],
            "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.85, 9, 0],
          },
        });
        map.addLayer({
          id: "clusters", type: "circle", source: "atlas", filter: ["has", "point_count"],
          paint: {
            "circle-color": "#111522",
            "circle-stroke-color": "#00D9FF",
            "circle-stroke-width": 1.2,
            "circle-stroke-opacity": 0.8,
            "circle-radius": ["step", ["get", "point_count"], 14, 5, 18, 15, 24],
          },
        });
        map.addLayer({
          id: "pulse", type: "circle", source: "atlas", filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "kind"], "festival"]],
          paint: { "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": "#00D9FF", "circle-stroke-width": 1.5, "circle-radius": 8, "circle-stroke-opacity": 0.6 },
        });
        map.addLayer({
          id: "points", type: "circle", source: "atlas", filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": ["match", ["get", "kind"], "city", KIND_COLOR.city, "venue", KIND_COLOR.venue, "festival", KIND_COLOR.festival, "milestone", KIND_COLOR.milestone, KIND_COLOR.event],
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, ["match", ["get", "kind"], "city", 4.5, 3.5], 10, ["match", ["get", "kind"], "city", 8, 7]],
            "circle-stroke-color": ["case", ["get", "legendary"], "#B7FF39", "#080A10"],
            "circle-stroke-width": ["case", ["get", "legendary"], 2, 1.2],
            "circle-opacity": ["match", ["get", "status"], "closed", 0.55, "historical", 0.55, "ended", 0.55, 1],
          },
        });

        // Пульсация фестивальных маркеров
        let raf = 0;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const animate = (t: number) => {
          if (!map || !map.getLayer("pulse")) return;
          const phase = (t % 2200) / 2200;
          map.setPaintProperty("pulse", "circle-radius", 6 + phase * 16);
          map.setPaintProperty("pulse", "circle-stroke-opacity", 0.7 * (1 - phase));
          raf = requestAnimationFrame(animate);
        };
        if (!reduced) raf = requestAnimationFrame(animate);
        map.once("remove", () => cancelAnimationFrame(raf));

        // Наведение на страны
        let hovered: string | null = null;
        map.on("mousemove", "countries-fill", (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const iso = String(f.properties?.iso);
          if (hovered && hovered !== iso) map!.setFeatureState({ source: "countries", id: hovered }, { hover: false });
          hovered = iso;
          map!.setFeatureState({ source: "countries", id: iso }, { hover: true });
          map!.getCanvas().style.cursor = f.properties?.active ? "pointer" : "";
        });
        map.on("mouseleave", "countries-fill", () => {
          if (hovered) map!.setFeatureState({ source: "countries", id: hovered }, { hover: false });
          hovered = null;
          map!.getCanvas().style.cursor = "";
        });

        const onPoint = (e: { features?: MapGeoJSONFeature[]; lngLat: { lng: number; lat: number } }) => {
          const f = e.features?.[0];
          if (!f) return;
          const p = f.properties as unknown as MapFeatureProps;
          showPopup(maplibregl, map!, (f.geometry as GeoJSON.Point).coordinates as [number, number], p);
          if (p.kind === "city" && mode === "full") selectCity(p, (f.geometry as GeoJSON.Point).coordinates as [number, number]);
        };
        map.on("click", "points", onPoint);
        map.on("mouseenter", "points", () => (map!.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", "points", () => (map!.getCanvas().style.cursor = ""));
        map.on("click", "clusters", async (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const src = map!.getSource("atlas") as GeoJSONSource;
          const zoom = await src.getClusterExpansionZoom(f.properties?.cluster_id);
          map!.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: zoom + 0.3 });
        });
        map.on("click", (e) => {
          const hits = map!.queryRenderedFeatures(e.point, { layers: ["points", "clusters"] });
          if (hits.length) return;
          const c = map!.queryRenderedFeatures(e.point, { layers: ["countries-fill"] })[0];
          if (!c?.properties?.active) return;
          const country = countryBySlug.get(String(c.properties.slug));
          if (!country) return;
          if (mode === "hero") router.push(`/${locale}/countries/${country.slug}`);
          else if (mode === "full") selectCountry(country);
        });

        // HTML-счётчики кластеров (не требуют glyph-шрифтов)
        const syncClusters = () => {
          if (!map) return;
          const seen = new Set<number>();
          for (const f of map.querySourceFeatures("atlas", { filter: ["has", "point_count"] })) {
            const id = f.properties?.cluster_id as number;
            if (seen.has(id)) continue;
            seen.add(id);
            let m = clusterMarkers.current.get(id);
            if (!m) {
              const el = document.createElement("div");
              el.className = "pointer-events-none font-mono text-[11px] font-medium text-ink";
              el.textContent = String(f.properties?.point_count_abbreviated ?? f.properties?.point_count);
              m = new maplibregl.Marker({ element: el }).setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number]);
              clusterMarkers.current.set(id, m);
            }
            m.addTo(map);
          }
          for (const [id, m] of clusterMarkers.current) if (!seen.has(id)) { m.remove(); clusterMarkers.current.delete(id); }
        };
        map.on("render", () => { if (map?.isSourceLoaded("atlas")) syncClusters(); });

        setStatus("ready");
      });
    })().catch(() => setStatus("error"));

    return () => {
      disposed = true;
      clusterMarkers.current.forEach((m) => m.remove());
      clusterMarkers.current.clear();
      map?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showPopup = useCallback((maplibregl: typeof import("maplibre-gl"), map: MLMap, coords: [number, number], p: MapFeatureProps) => {
    popupRef.current?.remove();
    const el = document.createElement("div");
    el.className = "min-w-[200px] max-w-[260px]";
    const kind = document.createElement("div");
    kind.className = "mb-1 font-mono text-[10px] uppercase tracking-widest";
    kind.style.color = KIND_COLOR[p.kind];
    kind.textContent = labels.kinds[p.kind === "venue" ? "venue" : p.kind] ?? p.kind;
    const title = document.createElement("div");
    title.className = "font-display text-sm font-semibold text-ink";
    title.textContent = p.name;
    const sub = document.createElement("div");
    sub.className = "mt-0.5 text-xs text-ink-2";
    sub.textContent = p.subtitle;
    const prec = document.createElement("div");
    prec.className = "mt-1 text-[10px] text-ink-3";
    prec.textContent = `⌖ ${labels.precision[p.precision] ?? p.precision}`;
    const a = document.createElement("a");
    a.href = p.href;
    a.className = "mt-2 inline-block text-xs font-medium text-cyan hover:text-acid";
    a.textContent = `${labels.explore} →`;
    a.addEventListener("click", (ev) => { ev.preventDefault(); router.push(p.href); });
    el.append(kind, title, sub, prec, a);
    popupRef.current = new maplibregl.Popup({ offset: 12, closeButton: true, maxWidth: "280px" }).setLngLat(coords).setDOMContent(el).addTo(map);
  }, [labels, router]);

  const setSelectedState = (iso: string | null) => {
    const map = mapRef.current;
    if (!map || !map.getSource("countries")) return;
    map.removeFeatureState({ source: "countries" });
    if (iso) map.setFeatureState({ source: "countries", id: iso }, { selected: true });
  };

  const selectCountry = useCallback((c: MapCountry | null) => {
    setSelCountry(c);
    setSelCity(null);
    setPanelOpen(true);
    setSelectedState(c?.iso ?? null);
    if (c) {
      setContinent(c.continent);
      mapRef.current?.flyTo({ center: c.center, zoom: c.zoom, speed: 1.2, essential: true });
    }
  }, []);

  const selectCity = useCallback((p: MapFeatureProps, coords: [number, number]) => {
    const c = countryBySlug.get(p.country) ?? null;
    setSelCountry(c);
    setSelCity(p);
    setPanelOpen(true);
    setSelectedState(c?.iso ?? null);
    mapRef.current?.flyTo({ center: coords, zoom: 11, speed: 1.2, essential: true });
  }, [countryBySlug]);

  const goWorld = () => {
    setSelCountry(null); setSelCity(null); setContinent(""); setSelectedState(null);
    popupRef.current?.remove();
    mapRef.current?.flyTo({ center: [12, 28], zoom: 1.6, essential: true });
  };
  const goContinent = (c: MapContinent) => {
    setContinent(c.slug); setSelCountry(null); setSelCity(null); setSelectedState(null);
    mapRef.current?.flyTo({ center: c.center, zoom: c.zoom, essential: true });
  };

  // фокус на стране при монтировании (страница страны)
  useEffect(() => {
    if (status !== "ready" || !focusCountry) return;
    const c = countryBySlug.get(focusCountry);
    if (c) setSelectedState(c.iso);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, focusCountry]);

  // обновление данных при изменении фильтров
  useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready" || !map) return;
    const fc = { type: "FeatureCollection" as const, features: filtered };
    (map.getSource("atlas") as GeoJSONSource | undefined)?.setData(fc);
    (map.getSource("atlas-heat") as GeoJSONSource | undefined)?.setData(heat ? fc : { type: "FeatureCollection", features: [] });
  }, [filtered, heat, status]);

  const cityFeatures = useMemo(
    () => (selCity ? features.filter((f) => f.properties.city === selCity.slug && f.properties.kind !== "city") : []),
    [selCity, features]
  );
  const countryCities = useMemo(
    () => (selCountry ? features.filter((f) => f.properties.kind === "city" && f.properties.country === selCountry.slug) : []),
    [selCountry, features]
  );

  const flyToFeature = (f: MapFeature) => {
    const coords = f.geometry.coordinates as [number, number];
    mapRef.current?.flyTo({ center: coords, zoom: Math.max(mapRef.current.getZoom(), f.properties.kind === "city" ? 10 : 13), essential: true });
    import("maplibre-gl").then(({ default: ml }) => mapRef.current && showPopup(ml, mapRef.current, coords, f.properties));
    if (f.properties.kind === "city" && mode === "full") selectCity(f.properties, coords);
    setQ("");
  };

  const kindToggles: [Kind, string][] = [["city", labels.cities], ["venue", labels.clubs], ["festival", labels.festivals], ["milestone", labels.milestones], ["event", labels.events]];

  return (
    <div className={cn("relative isolate overflow-hidden bg-bg", className)}>
      <div ref={container} className="h-full w-full" aria-label="map" role="region" />
      {status === "loading" && (
        <div className="absolute inset-0 grid place-items-center text-sm text-ink-3">
          <div className="flex items-center gap-3"><span className="relative h-3 w-3"><span className="absolute inset-0 animate-ping rounded-full bg-cyan/60" /><span className="absolute inset-0.5 rounded-full bg-cyan" /></span>{labels.loading}</div>
        </div>
      )}
      {status === "error" && <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-ink-2">{labels.webglError}</div>}

      {mode === "full" && status === "ready" && (
        <>
          {/* Верхняя панель: континенты и поиск */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-3 sm:p-4 lg:flex-row lg:items-start">
            <div className="pointer-events-auto relative w-full max-w-sm">
              <label className="flex h-10 items-center gap-2 rounded-full border border-line-2 bg-bg/85 px-3 text-sm backdrop-blur">
                <Search className="h-4 w-4 text-ink-3" aria-hidden />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={labels.searchPlaceholder} aria-label={labels.searchPlaceholder} className="w-full bg-transparent text-ink placeholder:text-ink-3 focus:outline-none" />
              </label>
              {searchHits.length > 0 && (
                <ul className="absolute mt-2 w-full overflow-hidden rounded-2xl border border-line-2 bg-card p-1 shadow-2xl">
                  {searchHits.map((f) => (
                    <li key={f.properties.id}>
                      <button onClick={() => flyToFeature(f)} className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left hover:bg-bg-2">
                        <span className="min-w-0"><span className="block truncate text-sm">{f.properties.name}</span><span className="block truncate text-xs text-ink-3">{f.properties.subtitle}</span></span>
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: KIND_COLOR[f.properties.kind] }} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="pointer-events-auto flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button onClick={goWorld} className={cn("h-10 shrink-0 rounded-full border px-4 text-sm backdrop-blur", !continent ? "border-cyan/60 bg-cyan/10 text-cyan" : "border-line-2 bg-bg/80 text-ink-2 hover:text-ink")}>{labels.world}</button>
              {continents.map((c) => (
                <button key={c.slug} onClick={() => goContinent(c)} className={cn("h-10 shrink-0 rounded-full border px-4 text-sm backdrop-blur", continent === c.slug ? "border-cyan/60 bg-cyan/10 text-cyan" : "border-line-2 bg-bg/80 text-ink-2 hover:text-ink")}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Слои и фильтры */}
          <div className="absolute bottom-3 left-3 z-10 w-[min(320px,calc(100%-1.5rem))] sm:bottom-4 sm:left-4">
            <details className="group rounded-2xl border border-line-2 bg-bg/90 backdrop-blur" open={filtersOpen} onToggle={(e) => setFiltersOpen((e.target as HTMLDetailsElement).open)}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium">
                <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-cyan" aria-hidden />{labels.filters}</span>
                <ChevronRight className="h-4 w-4 text-ink-3 transition-transform group-open:rotate-90" aria-hidden />
              </summary>
              <div className="space-y-4 border-t border-line px-4 pb-4 pt-3">
                <fieldset>
                  <legend className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-3"><Layers className="h-3 w-3" />{labels.layers}</legend>
                  <div className="flex flex-wrap gap-1.5">
                    {kindToggles.map(([k, label]) => (
                      <button key={k} aria-pressed={kinds[k]} onClick={() => setKinds((s) => ({ ...s, [k]: !s[k] }))} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs", kinds[k] ? "border-line-2 bg-card text-ink" : "border-line text-ink-3")}>
                        <span className="h-2 w-2 rounded-full" style={{ background: kinds[k] ? KIND_COLOR[k] : "#333b52" }} />{label}
                      </button>
                    ))}
                    <button aria-pressed={heat} onClick={() => setHeat((h) => !h)} className={cn("rounded-full border px-2.5 py-1 text-xs", heat ? "border-line-2 bg-card text-ink" : "border-line text-ink-3")}>{labels.heatmap}</button>
                  </div>
                </fieldset>
                <div className="grid grid-cols-2 gap-2">
                  <label className="col-span-2 text-xs text-ink-3">
                    {labels.genre}
                    <select value={genre} onChange={(e) => setGenre(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-line bg-bg-2 px-2 text-sm text-ink">
                      <option value="">{labels.all}</option>
                      {genres.map((g) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-ink-2"><input type="checkbox" checked={legendaryOnly} onChange={(e) => setLegendaryOnly(e.target.checked)} className="accent-[#B7FF39]" />{labels.onlyLegendary}</label>
                  <label className="flex items-center gap-2 text-xs text-ink-2"><input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} className="accent-[#00D9FF]" />{labels.onlyActive}</label>
                </div>
                <div className="rounded-xl border border-line bg-bg-2 p-3">
                  <label className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1.5 text-ink"><History className="h-3.5 w-3.5 text-acid" />{labels.historicalMode}</span>
                    <input type="checkbox" checked={historical} onChange={(e) => setHistorical(e.target.checked)} className="accent-[#B7FF39]" />
                  </label>
                  {historical && (
                    <div className="mt-3">
                      <div className="flex items-baseline justify-between"><span className="font-display text-2xl font-semibold text-acid">{year}</span><span className="text-[10px] text-ink-3">{filtered.length}</span></div>
                      <input type="range" min={1920} max={2026} value={year} onChange={(e) => setYear(Number(e.target.value))} className="mt-2 w-full accent-[#B7FF39]" aria-label={labels.historicalMode} />
                      <p className="mt-2 text-[11px] leading-snug text-ink-3">{labels.yearHint}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => { setKinds({ city: true, venue: true, festival: true, milestone: true, event: true }); setGenre(""); setLegendaryOnly(false); setActiveOnly(false); setHistorical(false); }} className="text-xs text-ink-3 hover:text-ink">{labels.reset}</button>
              </div>
            </details>
          </div>

          {/* Информационная панель: мир → страна → город */}
          {panelOpen && (selCountry || selCity) && (
            <aside className="absolute inset-x-3 bottom-3 z-20 max-h-[55%] overflow-auto rounded-2xl border border-line-2 bg-bg/95 p-5 backdrop-blur scrollbar-thin sm:inset-x-auto sm:bottom-4 sm:right-16 sm:top-20 sm:max-h-none sm:w-[380px]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <nav className="flex flex-wrap items-center gap-1 text-xs text-ink-3" aria-label="map breadcrumb">
                  <button onClick={goWorld} className="hover:text-cyan">{labels.world}</button>
                  {selCountry && (<><ChevronRight className="h-3 w-3" /><button onClick={() => selectCountry(selCountry)} className="hover:text-cyan">{selCountry.name}</button></>)}
                  {selCity && (<><ChevronRight className="h-3 w-3" /><span className="text-ink">{selCity.name}</span></>)}
                </nav>
                <button onClick={() => setPanelOpen(false)} aria-label="close" className="grid h-7 w-7 place-items-center rounded-full border border-line text-ink-2 hover:text-ink"><X className="h-3.5 w-3.5" /></button>
              </div>
              {selCity ? (
                <div>
                  <h2 className="font-display text-2xl font-semibold">{selCity.name}</h2>
                  <p className="mt-1 text-sm text-ink-2">{selCity.subtitle}</p>
                  <ul className="mt-4 space-y-1.5">
                    {cityFeatures.map((f) => (
                      <li key={f.properties.id}>
                        <button onClick={() => flyToFeature(f)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-card">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: KIND_COLOR[f.properties.kind] }} />
                          <span className="truncate">{f.properties.name}</span>
                          <span className="ml-auto shrink-0 text-[10px] uppercase text-ink-3">{labels.kinds[f.properties.kind]}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <Link href={selCity.href} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-cyan hover:text-acid">{labels.explore} <ChevronRight className="h-4 w-4" /></Link>
                </div>
              ) : selCountry ? (
                <div>
                  <h2 className="font-display text-2xl font-semibold">{selCountry.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{selCountry.summary}</p>
                  <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
                    {([[labels.statsCities, selCountry.stats.cities], [labels.statsClubs, selCountry.stats.clubs], [labels.statsFestivals, selCountry.stats.festivals], [labels.statsArtists, selCountry.stats.artists]] as const).map(([l, v]) => (
                      <div key={l} className="rounded-xl border border-line bg-bg-2 p-2"><dt className="text-[10px] uppercase text-ink-3">{l}</dt><dd className="font-display text-lg">{v}</dd></div>
                    ))}
                  </dl>
                  {countryCities.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-1.5">
                      {countryCities.map((f) => (
                        <li key={f.properties.id}><button onClick={() => flyToFeature(f)} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs hover:border-cyan hover:text-cyan"><Crosshair className="h-3 w-3" />{f.properties.name}</button></li>
                      ))}
                    </ul>
                  )}
                  <Link href={`/${locale}/countries/${selCountry.slug}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-cyan hover:text-acid">{labels.explore} <ChevronRight className="h-4 w-4" /></Link>
                </div>
              ) : null}
            </aside>
          )}
          {!selCountry && !selCity && (
            <div className="pointer-events-none absolute bottom-4 right-16 z-10 hidden rounded-full border border-line bg-bg/80 px-3 py-1.5 text-xs text-ink-3 backdrop-blur md:block">{labels.clickCountry}</div>
          )}
          {!remoteBase && <div className="absolute right-3 top-4 z-10 hidden rounded-full border border-line bg-bg/80 px-3 py-1 text-[10px] text-ink-3 lg:block">Offline basemap · Natural Earth</div>}
        </>
      )}
    </div>
  );
}
