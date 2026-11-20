import { getAtlas } from "@/lib/data";
import { tx } from "@/lib/atlas";
import { sectionsToText } from "@/lib/sections";
import { ADMIN_KINDS, entitiesOf, isAdminKind, type AdminKind } from "@/lib/admin-entities";
import { AdminShell, Field, Notice, inputCls } from "@/components/admin-ui";
import { updateArticle } from "../actions";
import { guard } from "../guard";

export const dynamic = "force-dynamic";

export default async function EditArticle({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ kind?: string; slug?: string; ok?: string; error?: string }> }) {
  const { locale } = await params;
  const session = await guard(locale, "editor");
  const sp = await searchParams;
  const kind: AdminKind = isAdminKind(sp.kind) ? sp.kind : "venue";
  const atlas = await getAtlas();
  const list = entitiesOf(atlas, kind);
  const item = list.find((x) => x.slug === sp.slug);
  const missingEn = list.filter((x) => !x.summary.en).length;
  const area = `${inputCls} h-auto py-2 font-mono text-xs leading-relaxed`;
  return (
    <AdminShell locale={locale} session={session} title="Статьи и переводы">
      <Notice ok={sp.ok} error={sp.error} />
      <nav className="mb-4 flex flex-wrap gap-1.5">
        {(Object.keys(ADMIN_KINDS) as AdminKind[]).map((k) => <a key={k} href={`/${locale}/admin/edit?kind=${k}`} className={`rounded-full border px-3 py-1.5 text-xs ${k === kind ? "border-cyan/60 text-cyan" : "border-line text-ink-2"}`}>{ADMIN_KINDS[k]}</a>)}
      </nav>
      <form method="get" className="mb-8 flex flex-wrap items-end gap-3">
        <input type="hidden" name="kind" value={kind} />
        <Field label={`Объект (без английского описания: ${missingEn} из ${list.length})`}>
          <select name="slug" defaultValue={item?.slug} className={`${inputCls} min-w-[320px]`}>
            {list.map((x) => <option key={x.slug} value={x.slug}>{tx(x.name, "ru")}{x.summary.en ? "" : "  · нет EN"}</option>)}
          </select>
        </Field>
        <button className="h-10 rounded-full border border-line-2 px-4 text-sm hover:border-cyan hover:text-cyan">Открыть</button>
      </form>
      {item && (
        <form action={updateArticle} className="grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="locale" value={locale} /><input type="hidden" name="kind" value={kind} /><input type="hidden" name="slug" value={item.slug} />
          <Field label="Название (RU) *"><input name="nameRu" required defaultValue={item.name.ru} className={inputCls} /></Field>
          <Field label="Название (EN)"><input name="nameEn" defaultValue={item.name.en ?? ""} className={inputCls} /></Field>
          <Field label="Краткое описание (RU) *"><textarea name="summaryRu" required minLength={20} rows={5} defaultValue={item.summary.ru} className={area} /></Field>
          <Field label="Краткое описание (EN)"><textarea name="summaryEn" rows={5} defaultValue={item.summary.en ?? ""} className={area} /></Field>
          <Field label="Разделы статьи (RU)" hint="Формат: «## Заголовок», затем текст. Абзацы — через пустую строку."><textarea name="sectionsRu" rows={16} defaultValue={sectionsToText(item.sections, "ru")} className={area} /></Field>
          <Field label="Разделы статьи (EN)" hint="Перевод сопоставляется с русскими разделами по порядку."><textarea name="sectionsEn" rows={16} defaultValue={sectionsToText(item.sections, "en")} className={area} /></Field>
          <p className="text-xs text-warn lg:col-span-2">Пишите только подтверждаемые источниками факты. После сохранения статус «Проверено» сбрасывается — текст нужно сверить заново на странице «Проверка данных».</p>
          <div className="lg:col-span-2"><button className="h-11 rounded-full bg-ink px-6 text-sm font-medium text-bg hover:bg-acid">Сохранить статью</button></div>
        </form>
      )}
    </AdminShell>
  );
}
