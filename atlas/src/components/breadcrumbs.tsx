import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-ink-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 text-ink-3" aria-hidden />}
            {it.href ? <Link href={it.href} className="hover:text-cyan">{it.label}</Link> : <span className="text-ink">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
