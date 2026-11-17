export function KeyFacts({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  const rows = items.filter((i) => i.value !== null && i.value !== undefined && i.value !== "");
  return (
    <dl className="divide-y divide-line rounded-2xl border border-line bg-bg-2">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[minmax(110px,38%)_1fr] gap-3 px-4 py-3 text-sm">
          <dt className="text-ink-3">{r.label}</dt>
          <dd className="text-ink">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
