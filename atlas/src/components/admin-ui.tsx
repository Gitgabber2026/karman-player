import Link from "next/link";
import type { Session } from "@/lib/auth";
import { logout } from "@/app/[locale]/admin/actions";

export const inputCls = "h-10 w-full rounded-lg border border-line bg-card px-3 text-sm text-ink [color-scheme:dark]";
export const labelCls = "flex flex-col gap-1 text-xs text-ink-3";

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className={labelCls}>
      {label}
      {children}
      {hint && <span className="text-[11px] text-ink-3">{hint}</span>}
    </label>
  );
}

const MESSAGES: Record<string, string> = {
  auth: "Неверный email или пароль.",
  db: "База данных не подключена (DATABASE_URL).",
  dates: "Проверьте даты: окончание раньше начала.",
  year: "Год выпуска не совпадает с датой начала.",
  city: "Город не найден.",
  festival: "Фестиваль не найден.",
  "event-published": "Событие опубликовано.",
  "event-review": "Событие отправлено на модерацию редактору.",
  edition: "Выпуск фестиваля сохранён вместе с источником.",
  publish: "Опубликовано.",
  unpublish: "Снято с публикации.",
  delete: "Удалено.",
};

export function Notice({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <div role="status" className={`mb-6 rounded-xl border p-3 text-sm ${error ? "border-danger/50 bg-danger/5 text-danger" : "border-acid/50 bg-acid/5 text-acid"}`}>
      {error ? MESSAGES[error] ?? `Ошибка в полях: ${error}` : MESSAGES[ok!] ?? `Сохранено: ${ok}`}
    </div>
  );
}

export function AdminShell({ locale, session, children, title }: { locale: string; session: Session; children: React.ReactNode; title: string }) {
  const nav = [["", "Обзор"], ["/events/new", "Новое событие"], ["/editions/new", "Выпуск фестиваля"], ["/verify", "Проверка данных"]];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <nav className="flex flex-wrap gap-1">
          {nav.map(([p, l]) => <Link key={p} href={`/${locale}/admin${p}`} className="rounded-full px-3 py-1.5 text-sm text-ink-2 hover:bg-card hover:text-ink">{l}</Link>)}
        </nav>
        <form action={logout} className="flex items-center gap-3 text-xs text-ink-3">
          <input type="hidden" name="locale" value={locale} />
          {session.email} · <span className="uppercase text-cyan">{session.role}</span>
          <button className="rounded-full border border-line px-3 py-1 hover:text-ink">Выйти</button>
        </form>
      </div>
      <h1 className="mb-6 font-display text-3xl font-semibold">{title}</h1>
      {children}
    </div>
  );
}
