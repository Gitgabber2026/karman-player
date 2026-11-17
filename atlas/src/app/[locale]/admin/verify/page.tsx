import { getAtlas } from "@/lib/data";
import { getDict } from "@/lib/i18n";
import { tx } from "@/lib/atlas";
import { AdminShell, Notice, inputCls } from "@/components/admin-ui";
import { VerificationBadge } from "@/components/verification-badge";
import { setVerification } from "../actions";
import { guard } from "../guard";

export const dynamic = "force-dynamic";

const KINDS = { venue: "Клубы", festival: "Фестивали", artist: "Артисты", city: "Города", country: "Страны", genre: "Жанры", label: "Лейблы" } as const;
type Kind = keyof typeof KINDS;

export default async function Verify({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ kind?: string; ok?: string }> }) {
  const { locale } = await params;
  const session = await guard(locale, "editor");
  const sp = await searchParams;
  const kind: Kind = sp.kind && sp.kind in KINDS ? (sp.kind as Kind) : "venue";
  const atlas = await getAtlas();
  const t = getDict("ru");
  const list = { venue: atlas.d.venues, festival: atlas.d.festivals, artist: atlas.d.artists, city: atlas.d.cities, country: atlas.d.countries, genre: atlas.d.genres, label: atlas.d.labels }[kind];
  return (
    <AdminShell locale={locale} session={session} title="Проверка данных">
      {sp.ok && <Notice ok={`статус обновлён (${sp.ok})`} />}
      <p className="mb-4 max-w-2xl text-sm text-ink-2">Ставьте «verified» только после построчной сверки текста, дат и координат с источниками. Дата проверки фиксируется автоматически и показывается на странице объекта.</p>
      <nav className="mb-6 flex flex-wrap gap-1.5">
        {(Object.keys(KINDS) as Kind[]).map((k) => <a key={k} href={`/${locale}/admin/verify?kind=${k}`} className={`rounded-full border px-3 py-1.5 text-xs ${k === kind ? "border-cyan/60 text-cyan" : "border-line text-ink-2"}`}>{KINDS[k]}</a>)}
      </nav>
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {list.map((x) => (
          <li key={x.slug} className="flex flex-wrap items-center gap-3 p-3 text-sm">
            <span className="min-w-[180px] font-medium">{tx(x.name, "ru")}</span>
            <VerificationBadge status={x.verification} t={t} />
            <span className="text-xs text-ink-3">{x.sources.length} ист. · {x.checkedAt ? x.checkedAt.slice(0, 10) : "не проверялось"}</span>
            <form action={setVerification} className="ml-auto flex gap-2">
              <input type="hidden" name="locale" value={locale} /><input type="hidden" name="kind" value={kind} /><input type="hidden" name="slug" value={x.slug} />
              <select name="status" defaultValue={x.verification} className={`${inputCls} h-8 w-40 text-xs`}>{Object.entries(t.verification).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              <button className="h-8 rounded-full border border-line-2 px-3 text-xs hover:border-cyan hover:text-cyan">Сохранить</button>
            </form>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
