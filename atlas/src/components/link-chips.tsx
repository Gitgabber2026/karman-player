import Link from "next/link";

export function LinkChips({ items, empty }: { items: { href: string; label: string; hint?: string }[]; empty?: string }) {
  if (!items.length) return empty ? <p className="text-sm text-ink-3">{empty}</p> : null;
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((i) => (
        <li key={i.href}>
          <Link href={i.href} className="inline-flex items-center gap-2 rounded-full border border-line bg-bg-2 px-3 py-1.5 text-sm text-ink hover:border-cyan hover:text-cyan">
            {i.label}
            {i.hint && <span className="text-xs text-ink-3">{i.hint}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
