import Link from "next/link";
import { pageContext } from "@/lib/page";
import { tx, hrefFor, GRAPH_ORDER, type GraphKind } from "@/lib/atlas";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FilterForm } from "@/components/filter-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Связи / Connections" };

const COLOR: Record<GraphKind, string> = { artist: "#F4F5F8", genre: "#9D4EDD", city: "#B7FF39", venue: "#00D9FF", festival: "#FFB547", label: "#FF5D7A" };
const linkKind: Record<GraphKind, "artist" | "genre" | "city" | "venue" | "festival" | "label"> = { artist: "artist", genre: "genre", city: "city", venue: "venue", festival: "festival", label: "label" };

export default async function Connections({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ node?: string; kind?: string; slug?: string }> }) {
  const { locale, t, atlas } = await pageContext(params);
  const sp = await searchParams;
  const [k0, s0] = sp.node?.split(":") ?? [sp.kind, sp.slug];
  const kind = (GRAPH_ORDER.includes(k0 as GraphKind) ? k0 : "artist") as GraphKind;
  const slug = s0 && atlas.nodeLabel(kind, s0) ? s0 : kind === "artist" ? "jeff-mills" : (s0 ?? "jeff-mills");
  const graph = atlas.connections(kind, slug);
  const colTitle: Record<GraphKind, string> = { artist: t.common.artists, genre: t.common.genres, city: t.common.cities, venue: t.common.clubs, festival: t.common.festivals, label: t.common.labels };

  const W = 1280, colW = W / GRAPH_ORDER.length, rowH = 46, top = 56;
  const maxRows = Math.max(1, ...(graph?.columns.map((c) => c.nodes.length) ?? [1]));
  const H = top + maxRows * rowH + 20;
  const pos = new Map<string, { x: number; y: number }>();
  graph?.columns.forEach((c, ci) => c.nodes.forEach((n, ri) => pos.set(n.id, { x: ci * colW + 16, y: top + ri * rowH })));
  const options = GRAPH_ORDER.flatMap((k) => {
    const xs = k === "artist" ? atlas.d.artists : k === "genre" ? atlas.d.genres : k === "city" ? atlas.d.cities.filter((c) => c.capital) : k === "venue" ? atlas.d.venues : k === "festival" ? atlas.d.festivals : atlas.d.labels;
    return xs.map((x) => ({ value: `${k}:${x.slug}`, label: `${colTitle[k]} — ${tx(x.name, locale)}` }));
  });

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t.map.world, href: `/${locale}` }, { label: t.nav.connections }]} />
      <h1 className="mt-6 font-display text-4xl font-semibold sm:text-6xl">Music Culture Connections</h1>
      <p className="mt-4 max-w-3xl text-ink-2">{locale === "ru" ? "Артист → Жанр → Город → Клуб → Фестиваль → Лейбл. Граф строится из связей базы данных: резиденции, выступления на фестивалях, лейблы, география жанров. Показаны прямые связи и связи второго уровня." : "Artist → Genre → City → Club → Festival → Label, built from database relations."}</p>
      <div className="mt-8"><FilterForm applyLabel={locale === "ru" ? "Показать" : "Show"} resetLabel={t.common.reset} fields={[{ name: "node", label: locale === "ru" ? "Центральный объект" : "Root", type: "select", value: `${kind}:${slug}`, options }]} /></div>
      {!graph ? <p className="mt-10 text-ink-2">{t.common.nothing}</p> : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-bg-2 scrollbar-thin">
          <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[1100px]" role="img" aria-label="connections graph">
            {GRAPH_ORDER.map((k, i) => (
              <text key={k} x={i * colW + 16} y={30} fill={COLOR[k]} fontSize="12" fontFamily="var(--font-mono)" letterSpacing="2">{colTitle[k].toUpperCase()}</text>
            ))}
            {graph.edges.map((e, i) => {
              const a = pos.get(e.from), b = pos.get(e.to);
              if (!a || !b) return null;
              const [l, r] = a.x <= b.x ? [a, b] : [b, a];
              const x1 = l.x + colW - 40, x2 = r.x - 6;
              const same = Math.abs(l.x - r.x) < 1;
              const d = same ? `M${l.x + 4},${l.y + 14} C${l.x - 30},${l.y + 14} ${r.x - 30},${r.y + 14} ${r.x + 4},${r.y + 14}` : `M${x1},${l.y + 14} C${(x1 + x2) / 2},${l.y + 14} ${(x1 + x2) / 2},${r.y + 14} ${x2},${r.y + 14}`;
              const touchesRoot = e.from === graph.root || e.to === graph.root;
              return <path key={i} d={d} fill="none" stroke={touchesRoot ? "#00D9FF" : "#333b52"} strokeOpacity={touchesRoot ? 0.7 : 0.6} strokeWidth={touchesRoot ? 1.4 : 1} />;
            })}
            {graph.columns.flatMap((c) => c.nodes.map((n) => {
              const p = pos.get(n.id)!;
              const label = tx(atlas.nodeLabel(n.kind, n.slug), locale);
              const isRoot = n.id === graph.root;
              return (
                <a key={n.id} href={`/${locale}/connections?node=${n.kind}:${n.slug}`}>
                  <rect x={p.x - 6} y={p.y} width={colW - 34} height={28} rx={14} fill={isRoot ? "#00D9FF" : "#171C2A"} stroke={COLOR[n.kind]} strokeOpacity={isRoot ? 1 : n.depth === 1 ? 0.8 : 0.3} />
                  <text x={p.x + 8} y={p.y + 18} fill={isRoot ? "#080A10" : n.depth === 2 ? "#9CA3B5" : "#F4F5F8"} fontSize="12" fontWeight={isRoot ? 700 : 400}>{label.length > 24 ? label.slice(0, 23) + "…" : label}</text>
                </a>
              );
            }))}
          </svg>
        </div>
      )}
      {graph && (
        <p className="mt-4 text-sm text-ink-3">
          {locale === "ru" ? "Нажмите на узел, чтобы сделать его центральным. Страница объекта: " : "Click a node to re-centre. Open page: "}
          <Link href={hrefFor(locale, linkKind[kind], slug)} className="text-cyan hover:text-acid">{tx(atlas.nodeLabel(kind, slug), locale)} →</Link>
        </p>
      )}
    </div>
  );
}
