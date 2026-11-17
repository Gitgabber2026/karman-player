"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export interface TreeNode { slug: string; name: string; family: string; year: number | null; parent: string | null; href: string; bpm: string }
export interface TreeEdge { from: string; to: string; type: string }

const FAMILY_COLOR: Record<string, string> = { house: "#9D4EDD", techno: "#00D9FF", trance: "#B7FF39", bass: "#FFB547", "hard-dance": "#FF5D7A", other: "#C8CCD8" };
const W = 1200, LANE = 118, PAD_L = 130, PAD_R = 40, Y0 = 1940, Y1 = 2025;

/**
 * Интерактивное дерево жанров: ось X — время возникновения, полосы — семейства.
 * Сплошные линии — «происходит от / родительский жанр», пунктир — влияние и родство.
 */
export function GenreTree({ nodes, edges, families, labels }: { nodes: TreeNode[]; edges: TreeEdge[]; families: { id: string; label: string }[]; labels: { derived: string; influenced: string; hint: string; all: string } }) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const [family, setFamily] = useState<string>("");
  const x = (year: number | null) => PAD_L + (((year ?? 1990) - Y0) / (Y1 - Y0)) * (W - PAD_L - PAD_R);

  const layout = useMemo(() => {
    const pos = new Map<string, { x: number; y: number }>();
    families.forEach((f, li) => {
      const list = nodes.filter((n) => n.family === f.id).sort((a, b) => (a.year ?? 1990) - (b.year ?? 1990));
      const rows: number[] = [];
      for (const n of list) {
        const nx = x(n.year);
        let row = rows.findIndex((endX) => nx - endX > 112);
        if (row === -1) { rows.push(0); row = rows.length - 1; }
        rows[row] = nx;
        pos.set(n.slug, { x: nx, y: li * LANE + 34 + row * 26 });
      }
    });
    return pos;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, families]);

  const allEdges = useMemo(() => [
    ...nodes.filter((n) => n.parent).map((n) => ({ from: n.slug, to: n.parent!, type: "derived-from" })),
    ...edges,
  ].filter((e) => layout.has(e.from) && layout.has(e.to)), [nodes, edges, layout]);
  const linked = useMemo(() => {
    if (!hover) return null;
    const s = new Set([hover]);
    allEdges.forEach((e) => { if (e.from === hover) s.add(e.to); if (e.to === hover) s.add(e.from); });
    return s;
  }, [hover, allEdges]);
  const H = families.length * LANE + 30;
  const visible = (slug: string) => !family || nodes.find((n) => n.slug === slug)?.family === family;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setFamily("")} className={cn("rounded-full border px-3 py-1.5 text-xs", !family ? "border-cyan/60 bg-cyan/10 text-cyan" : "border-line text-ink-2")}>{labels.all}</button>
        {families.map((f) => (
          <button key={f.id} onClick={() => setFamily(f.id)} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs", family === f.id ? "border-line-2 bg-card text-ink" : "border-line text-ink-2")}>
            <span className="h-2 w-2 rounded-full" style={{ background: FAMILY_COLOR[f.id] }} />{f.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-bg-2 scrollbar-thin">
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[1000px]" role="img" aria-label="genre tree">
          {[1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].map((y) => (
            <g key={y}><line x1={x(y)} x2={x(y)} y1={0} y2={H} stroke="#252b3d" strokeDasharray="2 6" /><text x={x(y) + 4} y={H - 8} fill="#6b7287" fontSize="10" fontFamily="var(--font-mono)">{y}</text></g>
          ))}
          {families.map((f, i) => (
            <g key={f.id}>
              <line x1={0} x2={W} y1={i * LANE} y2={i * LANE} stroke="#1b2131" />
              <text x={14} y={i * LANE + 26} fill={FAMILY_COLOR[f.id]} fontSize="12" fontWeight="600" fontFamily="var(--font-display)">{f.label}</text>
            </g>
          ))}
          {allEdges.map((e, i) => {
            const a = layout.get(e.from)!, b = layout.get(e.to)!;
            const on = !linked || (linked.has(e.from) && linked.has(e.to) && (e.from === hover || e.to === hover));
            const show = visible(e.from) || visible(e.to);
            const mx = (a.x + b.x) / 2;
            return (
              <path key={i} d={`M${b.x},${b.y} C${mx},${b.y} ${mx},${a.y} ${a.x},${a.y}`} fill="none"
                stroke={e.type === "derived-from" ? "#9CA3B5" : "#00D9FF"} strokeWidth={on && hover ? 1.6 : 0.8}
                strokeDasharray={e.type === "derived-from" ? undefined : "3 4"} opacity={!show ? 0.04 : on ? (hover ? 0.95 : 0.35) : 0.06} />
            );
          })}
          {nodes.map((n) => {
            const p = layout.get(n.slug);
            if (!p) return null;
            const dim = (linked && !linked.has(n.slug)) || !visible(n.slug);
            return (
              <g key={n.slug} transform={`translate(${p.x},${p.y})`} className="cursor-pointer" opacity={dim ? 0.18 : 1}
                onMouseEnter={() => setHover(n.slug)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(n.slug)} onBlur={() => setHover(null)}
                onClick={() => router.push(n.href)} onKeyDown={(e) => e.key === "Enter" && router.push(n.href)} tabIndex={0} role="link" aria-label={`${n.name}${n.year ? `, ${n.year}` : ""}`}>
                <circle r={hover === n.slug ? 6 : 4.5} fill={FAMILY_COLOR[n.family]} stroke="#080A10" strokeWidth={1.5} />
                <text x={8} y={4} fill="#F4F5F8" fontSize="11" fontFamily="var(--font-sans)">{n.name}</text>
                <title>{`${n.name}${n.year ? ` · ~${n.year}` : ""}${n.bpm ? ` · ${n.bpm}` : ""}`}</title>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap gap-5 text-xs text-ink-3">
        <span className="flex items-center gap-2"><svg width="28" height="6"><line x1="0" y1="3" x2="28" y2="3" stroke="#9CA3B5" /></svg>{labels.derived}</span>
        <span className="flex items-center gap-2"><svg width="28" height="6"><line x1="0" y1="3" x2="28" y2="3" stroke="#00D9FF" strokeDasharray="3 4" /></svg>{labels.influenced}</span>
        <span>{labels.hint}</span>
      </div>
    </div>
  );
}
