import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as s from "@/db/schema";
import { authConfigured, getSession, hasRole } from "@/lib/auth";
import { AdminShell, Field, Notice, inputCls } from "@/components/admin-ui";
import { login, moderateEvent } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

export default async function Admin({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { locale } = await params;
  const sp = await searchParams;
  const db = getDb();
  const session = await getSession();

  if (!db || !authConfigured()) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <h1 className="font-display text-3xl font-semibold">Админ-панель недоступна</h1>
        <p className="mt-4 text-ink-2">Нужны DATABASE_URL и ADMIN_SESSION_SECRET (не менее 32 символов). Пользователь создаётся командой <code className="font-mono text-cyan">npm run admin:create</code>. См. README.</p>
      </div>
    );
  }

  if (!hasRole(session, "researcher")) {
    return (
      <div className="mx-auto max-w-sm px-4 py-20">
        <h1 className="mb-6 font-display text-3xl font-semibold">Вход для редакции</h1>
        <Notice error={sp.error} />
        <form action={login} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <Field label="Email"><input name="email" type="email" required autoComplete="username" className={inputCls} /></Field>
          <Field label="Пароль"><input name="password" type="password" required autoComplete="current-password" className={inputCls} /></Field>
          <button className="h-10 w-full rounded-full bg-ink text-sm font-medium text-bg hover:bg-acid">Войти</button>
        </form>
      </div>
    );
  }

  const [counts] = await db.select({
    events: sql<number>`count(*) filter (where ${s.events.publishState} = 'published')`.mapWith(Number),
    review: sql<number>`count(*) filter (where ${s.events.publishState} = 'review')`.mapWith(Number),
  }).from(s.events);
  const [{ editions }] = await db.select({ editions: sql<number>`count(*)`.mapWith(Number) }).from(s.festivalEditions);
  const verification = await db.execute<{ status: string; n: number }>(sql`
    select verification as status, count(*)::int as n from (
      select verification from venues union all select verification from festivals union all select verification from artists
      union all select verification from cities union all select verification from genres) x group by 1 order by 2 desc`);
  const queue = await db.select().from(s.events).where(eq(s.events.publishState, "review")).orderBy(desc(s.events.createdAt)).limit(50);
  const recent = await db.select().from(s.events).orderBy(desc(s.events.createdAt)).limit(10);
  const editor = hasRole(session, "editor");

  const Moderate = ({ id, actions }: { id: string; actions: [string, string][] }) => (
    <div className="flex gap-1.5">
      {actions.map(([a, l]) => (
        <form key={a} action={moderateEvent}>
          <input type="hidden" name="locale" value={locale} /><input type="hidden" name="id" value={id} /><input type="hidden" name="action" value={a} />
          <button className={`rounded-full border px-3 py-1 text-xs ${a === "delete" ? "border-danger/50 text-danger" : "border-line-2 hover:border-cyan hover:text-cyan"}`}>{l}</button>
        </form>
      ))}
    </div>
  );

  return (
    <AdminShell locale={locale} session={session!} title="Обзор">
      <Notice ok={sp.ok} error={sp.error} />
      <div className="grid gap-3 sm:grid-cols-3">
        {([["Опубликованные события", counts.events], ["На модерации", counts.review], ["Выпуски фестивалей", editions]] as const).map(([l, n]) => (
          <div key={l} className="rounded-2xl border border-line bg-card p-4"><div className="text-xs text-ink-3">{l}</div><div className="font-display text-3xl">{n}</div></div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-2">
        {verification.map((v) => <span key={v.status} className="rounded-full border border-line px-3 py-1">{v.status}: {v.n}</span>)}
      </div>

      <h2 className="mb-3 mt-10 font-display text-xl font-semibold">Очередь модерации</h2>
      {queue.length === 0 ? <p className="text-sm text-ink-3">Пусто.</p> : (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {queue.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-3 p-4">
              <span className="font-mono text-xs text-cyan">{e.startAt.toISOString().slice(0, 16).replace("T", " ")}</span>
              <span className="font-medium">{e.title}</span>
              <a href={e.officialUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-ink-3 underline">источник</a>
              <span className="ml-auto">{editor ? <Moderate id={e.id} actions={[["publish", "Опубликовать"], ["delete", "Удалить"]]} /> : <span className="text-xs text-ink-3">ждёт редактора</span>}</span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-3 mt-10 font-display text-xl font-semibold">Последние события</h2>
      {recent.length === 0 ? <p className="text-sm text-ink-3">Событий пока нет.</p> : (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {recent.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
              <span className="font-mono text-xs text-ink-3">{e.publishState}</span><span>{e.title}</span>
              {editor && <span className="ml-auto"><Moderate id={e.id} actions={e.publishState === "published" ? [["unpublish", "Снять"], ["delete", "Удалить"]] : [["publish", "Опубликовать"], ["delete", "Удалить"]]} /></span>}
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
