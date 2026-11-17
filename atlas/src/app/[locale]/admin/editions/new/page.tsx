import { getAtlas } from "@/lib/data";
import { getDict } from "@/lib/i18n";
import { tx } from "@/lib/atlas";
import { AdminShell, Field, Notice, inputCls } from "@/components/admin-ui";
import { createEdition } from "../../actions";
import { guard } from "../../guard";

export const dynamic = "force-dynamic";

export default async function NewEdition({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ error?: string }> }) {
  const { locale } = await params;
  const session = await guard(locale, "researcher");
  const sp = await searchParams;
  const atlas = await getAtlas();
  const t = getDict("ru");
  return (
    <AdminShell locale={locale} session={session} title="Выпуск фестиваля">
      <Notice error={sp.error} />
      <p className="mb-6 max-w-2xl text-sm text-ink-2">Ежегодный выпуск хранится отдельно от постоянных сведений о фестивале. Даты вносятся только по официальному источнику; повторное сохранение того же года обновляет выпуск.</p>
      <form action={createEdition} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="locale" value={locale} />
        <Field label="Фестиваль *"><select name="festival" required className={inputCls}>{atlas.d.festivals.map((f) => <option key={f.slug} value={f.slug}>{tx(f.name, "ru")}</option>)}</select></Field>
        <Field label="Год *"><input name="year" type="number" required min={1950} max={2100} className={inputCls} /></Field>
        <Field label="Дата начала"><input name="startDate" type="date" className={inputCls} /></Field>
        <Field label="Дата окончания"><input name="endDate" type="date" className={inputCls} /></Field>
        <Field label="Статус *"><select name="status" className={inputCls}>{Object.entries(t.eventStatus).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
        <div />
        <Field label="Официальный источник (URL) *"><input name="sourceUrl" type="url" required placeholder="https://" className={inputCls} /></Field>
        <Field label="Название источника *"><input name="sourceTitle" required placeholder="Официальный сайт фестиваля — анонс 2027" className={inputCls} /></Field>
        <div className="sm:col-span-2"><button className="h-11 rounded-full bg-ink px-6 text-sm font-medium text-bg hover:bg-acid">Сохранить выпуск</button></div>
      </form>
    </AdminShell>
  );
}
