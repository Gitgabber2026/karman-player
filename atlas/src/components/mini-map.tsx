import { AtlasMap } from "@/components/map/atlas-map";
import { mapProps } from "@/lib/map-props";
import type { Atlas, MapFeature } from "@/lib/atlas";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

/** Встроенная карта для страниц страны / города / маршрута */
export function MiniMap({ atlas, locale, t, features, center, zoom, focusCountry, mode = "city", className }: {
  atlas: Atlas; locale: Locale; t: Dict; features: MapFeature[]; center: [number, number]; zoom: number; focusCountry?: string; mode?: "city" | "hero"; className?: string;
}) {
  const mp = mapProps(atlas, locale, t);
  return (
    <div className={className ?? "h-[420px] overflow-hidden rounded-2xl border border-line"}>
      <AtlasMap mode={mode} features={features} {...mp} initialView={{ center, zoom }} focusCountry={focusCountry} className="h-full w-full" />
    </div>
  );
}
