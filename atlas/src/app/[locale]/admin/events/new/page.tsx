import { getAtlas } from "@/lib/data";
import { getDict } from "@/lib/i18n";
import { tx } from "@/lib/atlas";
import { AdminShell, Field, Notice, inputCls } from "@/components/admin-ui";
import { createEvent } from "../../actions";
import { guard } from "../../guard";

export const dynamic = "force-dynamic";

export default async function NewEvent({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ error?: string }> }) {
  const { locale } = await params;
  const session = await guard(locale, "researcher");
  const sp = await searchParams;
  const atlas = await getAtlas();
  const t = getDict("ru");
  return (
    <AdminShell locale={locale} session={session} title="Новое событие">
      <Notice error={sp.error} />
      <p className="mb-6 max-w-2xl text-sm text-ink-2">Добавляйте только реальные события, подтверждённые официальным источником. Поля, которых нет в источнике, оставляйте пустыми — на сайте они будут показаны как «Информация уточняется». От исследователя событие уходит на модерацию; от редактора публикуется сразу.</p>
      <form action={createEvent} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="locale" value={locale} />
        <div className="sm:col-span-2"><Field label="Название *"><input name="title" required minLength={3} maxLength={200} className={inputCls} /></Field></div>
        <Field label="Категория *"><select name="category" className={inputCls}>{Object.entries(t.eventCategory).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
        <Field label="Статус *"><select name="status" className={inputCls}>{Object.entries(t.eventStatus).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
        <Field label="Начало *" hint="Местное время площадки"><input type="datetime-local" name="startAt" required className={inputCls} /></Field>
        <Field label="Окончание"><input type="datetime-local" name="endAt" className={inputCls} /></Field>
        <Field label="Город *"><select name="city" required className={inputCls}>{atlas.d.cities.map((c) => <option key={c.slug} value={c.slug}>{tx(c.name, "ru")}</option>)}</select></Field>
        <Field label="Площадка из базы"><select name="venue" className={inputCls}><option value="">— нет в базе —</option>{atlas.d.venues.map((v) => <option key={v.slug} value={v.slug}>{tx(v.name, "ru")}</option>)}</select></Field>
        <Field label="Название площадки *"><input name="venueName" required className={inputCls} /></Field>
        <Field label="Адрес"><input name="address" className={inputCls} /></Field>
        <Field label="Широта" hint="Только из проверенного источника (OSM)"><input name="lat" type="number" step="any" min={-90} max={90} className={inputCls} /></Field>
        <Field label="Долгота"><input name="lng" type="number" step="any" min={-180} max={180} className={inputCls} /></Field>
        <div className="sm:col-span-2"><Field label="Лайнап" hint="По одному артисту в строке или через запятую"><textarea name="lineup" rows={3} className={`${inputCls} h-auto py-2`} /></Field></div>
        <div className="sm:col-span-2"><Field label="Жанры" hint="Ctrl/Cmd — выбрать несколько"><select name="genres" multiple size={6} className={`${inputCls} h-auto`}>{atlas.d.genres.map((g) => <option key={g.slug} value={g.slug}>{tx(g.name, "ru")}</option>)}</select></Field></div>
        <Field label="Организатор"><input name="organizer" className={inputCls} /></Field>
        <Field label="Возраст"><input name="age" placeholder="18+" className={inputCls} /></Field>
        <Field label="Стоимость" hint="Только если подтверждена"><input name="price" className={inputCls} /></Field>
        <Field label="Официальный источник *"><input name="officialUrl" type="url" required placeholder="https://" className={inputCls} /></Field>
        <div className="sm:col-span-2"><Field label="Описание"><textarea name="description" rows={4} className={`${inputCls} h-auto py-2`} /></Field></div>
        <div className="sm:col-span-2"><button className="h-11 rounded-full bg-ink px-6 text-sm font-medium text-bg hover:bg-acid">Сохранить событие</button></div>
      </form>
    </AdminShell>
  );
}
