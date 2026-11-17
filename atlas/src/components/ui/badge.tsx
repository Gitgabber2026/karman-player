import { cn } from "@/lib/utils";

const tones = {
  neutral: "border-line-2 text-ink-2",
  violet: "border-violet/50 text-[#c9a2f0] bg-violet/10",
  cyan: "border-cyan/40 text-cyan bg-cyan/5",
  acid: "border-acid/40 text-acid bg-acid/5",
  warn: "border-warn/40 text-warn bg-warn/5",
  danger: "border-danger/40 text-danger bg-danger/5",
} as const;

export function Badge({ children, tone = "neutral", className, title }: { children: React.ReactNode; tone?: keyof typeof tones; className?: string; title?: string }) {
  return (
    <span title={title} className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider", tones[tone], className)}>
      {children}
    </span>
  );
}
