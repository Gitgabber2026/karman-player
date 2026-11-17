import { hashString, cn } from "@/lib/utils";

const PALETTES = [
  ["#9D4EDD", "#00D9FF"],
  ["#00D9FF", "#B7FF39"],
  ["#9D4EDD", "#B7FF39"],
  ["#5B2A86", "#00D9FF"],
  ["#00D9FF", "#9D4EDD"],
];

/**
 * Тематическая заглушка вместо фотографии. Всегда явно маркирована,
 * чтобы её нельзя было принять за реальное изображение объекта.
 */
export function PlaceholderArt({ seed, label, className, kindLabel }: { seed: string; label: string; kindLabel?: string; className?: string }) {
  const h = hashString(seed);
  const [a, b] = PALETTES[h % PALETTES.length];
  const cx = 20 + (h % 60);
  const cy = 25 + ((h >> 8) % 50);
  const rings = 7 + ((h >> 4) % 6);
  const id = `g${h.toString(36)}`;
  return (
    <div className={cn("relative overflow-hidden bg-bg-2", className)} role="img" aria-label={label}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <radialGradient id={id} cx={`${cx}%`} cy={`${cy}%`} r="75%">
            <stop offset="0%" stopColor={a} stopOpacity="0.55" />
            <stop offset="55%" stopColor={b} stopOpacity="0.12" />
            <stop offset="100%" stopColor="#080A10" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${id})`} />
        {Array.from({ length: rings }, (_, i) => (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={6 + i * 7}
            ry={4 + i * 5.2}
            fill="none"
            stroke={i % 3 === 0 ? b : "#F4F5F8"}
            strokeOpacity={i % 3 === 0 ? 0.35 : 0.08}
            strokeWidth={0.25}
            transform={`rotate(${(h % 40) - 20} ${cx} ${cy})`}
          />
        ))}
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
        <span className="font-display text-[10px] uppercase tracking-[0.2em] text-ink/60">{kindLabel}</span>
        <span className="rounded-full border border-line-2 bg-bg/70 px-2 py-0.5 text-[9px] uppercase tracking-wider text-ink-2 backdrop-blur">
          placeholder
        </span>
      </div>
    </div>
  );
}
