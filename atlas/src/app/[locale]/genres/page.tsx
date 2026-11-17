import Link from "next/link";
import { pageContext } from "@/lib/page";
import { tx, hrefFor } from "@/lib/atlas";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { GenreTree } from "@/components/genre-tree";

export const dynamic = "force-dynamic";
export const metadata = { title: "Жанры / Genres" };

export default async function Genres({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t, atlas } = await pageContext(params);
  const families = (["house", "techno", "trance", "bass", "hard-dance", "other"] as const).map((id) => ({ id, label: t.family[id] }));
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t.map.world, href: `/${locale}` }, { label: t.nav.genres }]} />
      <h1 className="mt-6 font-display text-4xl font-semibold sm:text-6xl">{t.sections.genres}</h1>
      <p className="mt-4 max-w-3xl text-ink-2">{locale === "ru" ? "Дерево показывает, когда возникло каждое направление и как оно связано с другими. Годы приблизительны: жанры складываются постепенно." : "The tree shows when each style emerged and how it connects to others. Years are approximate."}</p>
      <div className="mt-10">
        <GenreTree
          families={families}
          nodes={atlas.d.genres.map((g) => ({ slug: g.slug, name: tx(g.name, locale), family: g.family, year: g.periodStart, parent: g.parent, href: hrefFor(locale, "genre", g.slug), bpm: g.bpm ? `${g.bpm[0]}–${g.bpm[1]} BPM` : "" }))}
          edges={atlas.d.genreRelationships.filter((r) => r.type !== "derived-from" || !atlas.genre(r.from)?.parent || atlas.genre(r.from)?.parent !== r.to)}
          labels={{ derived: locale === "ru" ? "происходит от" : "derived from", influenced: locale === "ru" ? "влияние / родство" : "influence / related", hint: locale === "ru" ? "Наведите на жанр, чтобы увидеть связи; нажмите, чтобы открыть статью." : "Hover to see links; click to open.", all: t.common.all }}
        />
      </div>
      <div className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {families.map((f) => (
          <section key={f.id}>
            <h2 className="mb-3 border-b border-line pb-2 font-display text-xl font-semibold">{f.label}</h2>
            <ul className="space-y-1.5">
              {atlas.d.genres.filter((g) => g.family === f.id).map((g) => (
                <li key={g.slug}><Link href={hrefFor(locale, "genre", g.slug)} className="flex items-baseline justify-between gap-3 rounded-lg px-2 py-1 hover:bg-card">
                  <span className={g.parent ? "pl-3 text-ink-2" : "font-medium"}>{tx(g.name, locale)}</span>
                  <span className="font-mono text-[11px] text-ink-3">{g.bpm ? `${g.bpm[0]}–${g.bpm[1]}` : "—"}</span>
                </Link></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
