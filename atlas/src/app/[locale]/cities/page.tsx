import { pageContext } from "@/lib/page";
import { tx, hrefFor } from "@/lib/atlas";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EntityCard } from "@/components/entity-card";
import { LinkChips } from "@/components/link-chips";

export const dynamic = "force-dynamic";
export const metadata = { title: "Города / Cities" };

export default async function Cities({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t, atlas } = await pageContext(params);
  const capitals = atlas.capitals();
  const others = atlas.d.cities.filter((c) => !c.capital);
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t.map.world, href: `/${locale}` }, { label: t.nav.cities }]} />
      <h1 className="mt-6 font-display text-4xl font-semibold sm:text-6xl">{t.sections.capitals}</h1>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {capitals.map((c) => (
          <EntityCard key={c.slug} href={hrefFor(locale, "city", c.slug)} title={tx(c.name, locale)} subtitle={tx(atlas.country(c.country)?.name, locale)} meta={tx(c.summary, locale)} kindLabel={t.kinds.city} seed={c.slug} />
        ))}
      </div>
      <h2 className="mb-4 mt-16 font-display text-2xl font-semibold">{t.common.cities}</h2>
      <LinkChips items={others.map((c) => ({ href: hrefFor(locale, "city", c.slug), label: tx(c.name, locale), hint: tx(atlas.country(c.country)?.name, locale) }))} />
    </div>
  );
}
