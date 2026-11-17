"use client";
import { useRouter, usePathname } from "next/navigation";
import { useRef } from "react";

export interface FilterField {
  name: string;
  label: string;
  type: "select" | "date" | "checkbox" | "search";
  options?: { value: string; label: string }[];
  value?: string;
}

/** GET-форма фильтров: работает без JS (кнопка «Применить»), с JS — применяется сразу. */
export function FilterForm({ fields, resetLabel, applyLabel, hidden }: { fields: FilterField[]; resetLabel: string; applyLabel: string; hidden?: Record<string, string> }) {
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const submit = () => {
    const fd = new FormData(ref.current!);
    const qs = new URLSearchParams();
    for (const [k, v] of fd.entries()) if (typeof v === "string" && v) qs.set(k, v);
    router.replace(`${pathname}${qs.size ? `?${qs}` : ""}`, { scroll: false });
  };
  return (
    <form ref={ref} method="get" onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-bg-2 p-4">
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {fields.map((f) => (
        <label key={f.name} className={f.type === "checkbox" ? "flex h-10 items-center gap-2 text-sm text-ink-2" : "flex min-w-[150px] flex-1 flex-col gap-1 text-xs text-ink-3 sm:flex-none"}>
          {f.type !== "checkbox" && f.label}
          {f.type === "select" && (
            <select name={f.name} defaultValue={f.value ?? ""} onChange={submit} className="h-10 rounded-lg border border-line bg-card px-3 text-sm text-ink">
              {f.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
          {f.type === "date" && <input type="date" name={f.name} defaultValue={f.value ?? ""} onChange={submit} className="h-10 rounded-lg border border-line bg-card px-3 text-sm text-ink [color-scheme:dark]" />}
          {f.type === "search" && <input type="search" name={f.name} defaultValue={f.value ?? ""} className="h-10 rounded-lg border border-line bg-card px-3 text-sm text-ink" />}
          {f.type === "checkbox" && (<><input type="checkbox" name={f.name} value="1" defaultChecked={f.value === "1"} onChange={submit} className="h-4 w-4 accent-[#B7FF39]" />{f.label}</>)}
        </label>
      ))}
      <div className="flex gap-2">
        <button type="submit" className="h-10 rounded-full bg-ink px-4 text-sm font-medium text-bg hover:bg-acid">{applyLabel}</button>
        <button type="button" onClick={() => { ref.current?.reset(); router.replace(pathname, { scroll: false }); }} className="h-10 rounded-full border border-line px-4 text-sm text-ink-2 hover:text-ink">{resetLabel}</button>
      </div>
    </form>
  );
}
