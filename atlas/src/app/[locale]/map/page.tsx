import type { Metadata } from "next";
import { pageContext } from "@/lib/page";
import { mapProps } from "@/lib/map-props";
import { AtlasMap } from "@/components/map/atlas-map";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Карта / Map" };

export default async function MapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t, atlas } = await pageContext(params);
  const mp = mapProps(atlas, locale, t);
  return (
    <div className="-mb-24">
      <h1 className="sr-only">{t.nav.map}</h1>
      <AtlasMap mode="full" features={atlas.mapFeatures(locale)} {...mp} className="h-[calc(100svh-4rem)]" />
    </div>
  );
}
