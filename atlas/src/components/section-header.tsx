import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SectionHeader({ index, title, kicker, href, linkLabel }: { index?: string; title: string; kicker?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div>
        {index && <div className="mb-2 font-mono text-xs text-cyan">{index}</div>}
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl lg:text-4xl">{title}</h2>
        {kicker && <p className="mt-2 max-w-2xl text-sm text-ink-2 sm:text-base">{kicker}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex items-center gap-1 text-sm text-ink-2 hover:text-acid">
          {linkLabel}
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}
