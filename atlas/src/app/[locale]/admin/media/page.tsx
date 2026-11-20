import { getAtlas } from "@/lib/data";
import { tx } from "@/lib/atlas";
import { LICENSES } from "@/lib/licenses";
import { ADMIN_KINDS, entitiesOf, isAdminKind, type AdminKind } from "@/lib/admin-entities";
import { AdminShell, Field, Notice, inputCls } from "@/components/admin-ui";
import { createMedia, deleteMedia } from "../actions";
import { guard } from "../guard";

export const dynamic = "force-dynamic";

export default async function Media({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ kind?: string; ok?: string; error?: string }> }) {
  const { locale } = await params;
  const session = await guard(locale, "editor");
  const sp = await searchParams;
  const kind: AdminKind = isAdminKind(sp.kind) ? sp.kind : "venue";
  const atlas = await getAtlas();
  const list = entitiesOf(atlas, kind);
  const media = atlas.d.media;
  return (
    <AdminShell locale={locale} session={session} title="Изображения">
      <Notice ok={sp.ok} error={sp.error} />
      <p className="mb-6 max-w-3xl text-sm text-ink-2">Добавляйте только изображения с разрешённой лицензией — например, из Wikimedia Commons (страница файла содержит автора и лицензию) или из официального пресс-кита с разрешением. Не используйте фото другого места или события под видом настоящего.</p>
      <nav className="mb-4 flex flex-wrap gap-1.5">
        {(Object.keys(ADMIN_KINDS) as AdminKind[]).map((k) => <a key={k} href={`/${locale}/admin/media?kind=${k}`} className={`rounded-full border px-3 py-1.5 text-xs ${k === kind ? "border-cyan/60 text-cyan" : "border-line text-ink-2"}`}>{ADMIN_KINDS[k]}</a>)}
      </nav>
      <form action={createMedia} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="locale" value={locale} /><input type="hidden" name="kind" value={kind} />
        <Field label="Объект *"><select name="slug" required className={inputCls}>{list.map((x) => <option key={x.slug} value={x.slug}>{tx(x.name, "ru")}</option>)}</select></Field>
        <Field label="URL изображения *" hint="https, прямая ссылка на файл (upload.wikimedia.org или .jpg/.png/.webp)"><input name="url" type="url" required className={inputCls} /></Field>
        <Field label="URL миниатюры"><input name="thumbUrl" type="url" className={inputCls} /></Field>
        <Field label="Альтернативный текст (RU) *"><input name="altRu" required minLength={3} className={inputCls} /></Field>
        <Field label="Альтернативный текст (EN)"><input name="altEn" className={inputCls} /></Field>
        <Field label="Подпись (RU)"><input name="captionRu" className={inputCls} /></Field>
        <Field label="Автор *"><input name="author" required className={inputCls} /></Field>
        <Field label="Лицензия *"><select name="license" className={inputCls}>{LICENSES.map((l) => <option key={l}>{l}</option>)}</select></Field>
        <Field label="Ссылка на текст лицензии *"><input name="licenseUrl" type="url" required className={inputCls} /></Field>
        <Field label="Страница источника *" hint="Например, страница файла на commons.wikimedia.org"><input name="sourceUrl" type="url" required className={inputCls} /></Field>
        <div className="sm:col-span-2"><button className="h-11 rounded-full bg-ink px-6 text-sm font-medium text-bg hover:bg-acid">Добавить изображение</button></div>
      </form>
      <h2 className="mb-3 mt-10 font-display text-xl font-semibold">Добавленные изображения ({media.length})</h2>
      {media.length === 0 ? <p className="text-sm text-ink-3">Пока нет — на сайте показываются маркированные заглушки.</p> : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((m) => (
            <li key={m.id} className="rounded-xl border border-line bg-card p-3 text-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.thumbUrl ?? m.url} alt={m.alt.ru} loading="lazy" className="mb-2 aspect-video w-full rounded-lg object-cover" />
              <div className="text-ink">{m.entityType}/{m.entitySlug}</div>
              <div className="text-ink-3">© {m.author} · {m.license}</div>
              <form action={deleteMedia} className="mt-2"><input type="hidden" name="locale" value={locale} /><input type="hidden" name="id" value={m.id} /><button className="text-danger hover:underline">Удалить</button></form>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
