import { pageContext } from "@/lib/page";
import { getAtlasState } from "@/lib/data";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { VerificationBadge } from "@/components/verification-badge";
import { Badge } from "@/components/ui/badge";
import type { VerificationStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "О данных / About the data" };

export default async function About({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t, atlas } = await pageContext(params);
  const state = await getAtlasState();
  const d = atlas.d;
  const ru = locale === "ru";
  const all = [...d.countries, ...d.cities, ...d.venues, ...d.festivals, ...d.artists, ...d.genres, ...d.labels];
  const byStatus = (["verified", "unverified", "historical", "outdated", "unknown"] as VerificationStatus[]).map((s) => [s, all.filter((x) => x.verification === s).length] as const);
  const withCoords = [...d.venues, ...d.festivals];
  const precision = (["address", "approximate", "city"] as const).map((p) => [p, withCoords.filter((x) => x.coords?.precision === p).length] as const);
  const noCoords = withCoords.filter((x) => !x.coords).length;
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t.map.world, href: `/${locale}` }, { label: t.nav.about }]} />
      <h1 className="mt-6 font-display text-4xl font-semibold sm:text-5xl">{t.footer.data}</h1>
      <div className="prose-atlas mt-8">
        <p>{ru ? "Electronic Music World Atlas — редакционная энциклопедия. Мы предпочитаем честное «информация уточняется» вымышленному факту. Ниже — текущее состояние базы и правила, по которым она наполняется." : "The atlas is an editorial encyclopedia that prefers an honest 'being researched' to an invented fact."}</p>
      </div>
      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl font-semibold">{ru ? "Статусы проверки" : "Verification statuses"}</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {byStatus.map(([s, n]) => (
            <li key={s} className="flex items-center justify-between rounded-xl border border-line bg-card p-4"><VerificationBadge status={s} t={t} /><span className="font-display text-2xl">{n}</span></li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-2">{ru ? "«Требует проверки» означает: текст подготовлен редакцией по общедоступным источникам (ссылки указаны на каждой странице), но ещё не сверён вручную построчно. «Проверено» ставится только после такой сверки с указанием даты." : "'Unverified' means drafted from public sources but not yet line-checked by an editor."}</p>
      </section>
      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl font-semibold">{ru ? "Точность координат" : "Coordinate precision"}</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {precision.map(([p, n]) => <li key={p} className="flex items-center justify-between rounded-xl border border-line bg-card p-4 text-sm"><span>{t.precision[p]}</span><span className="font-display text-2xl">{n}</span></li>)}
          <li className="flex items-center justify-between rounded-xl border border-line bg-card p-4 text-sm"><span>{ru ? "координаты не установлены — объект не показывается на карте" : "no coordinates — not on the map"}</span><span className="font-display text-2xl">{noCoords}</span></li>
        </ul>
      </section>
      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl font-semibold">{ru ? "Источники и интеграции" : "Sources & integrations"}</h2>
        <p className="mb-4 text-sm text-ink-2">{ru ? `Режим данных: ${state.mode === "database" ? "PostgreSQL + PostGIS" : "встроенный seed-набор"}. Источников в каталоге: ${d.sources.length}.` : `Data mode: ${state.mode}. Sources in catalogue: ${d.sources.length}.`}</p>
        <ul className="space-y-2">
          {state.integrations.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-bg-2 p-4 text-sm">
              <span>{i.name}</span><Badge tone={i.state === "connected" ? "acid" : i.state === "error" ? "danger" : "neutral"}>{i.state}</Badge>
              <span className="w-full text-xs text-ink-3">{i.state === "connected" ? `${i.count}` : i.detail}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="prose-atlas mt-10">
        <h2 className="mb-3 font-display text-xl font-semibold text-ink">{ru ? "Правила" : "Rules"}</h2>
        <p>{ru ? "1. События, даты, лайнапы и цены публикуются только из официальных источников или разрешённых API; у каждого события — ссылка на источник и время последней проверки." : "1. Events, dates, line-ups and prices come only from official sources or permitted APIs."}</p>
        <p>{ru ? "2. Даты фестивалей хранятся в ежегодных выпусках отдельно от постоянных сведений; даты прошлых лет не переносятся на новый год." : "2. Festival dates live in yearly editions; past dates are never carried over."}</p>
        <p>{ru ? "3. Изображения — только из разрешённых источников (Wikimedia Commons, пресс-киты) с автором, лицензией и ссылкой. До их добавления показываются маркированные заглушки." : "3. Images only from permitted sources with author, licence and link; otherwise labelled placeholders."}</p>
        <p>{ru ? "4. Мы не обходим ограничения доступа, robots.txt и условия использования сайтов. Для Resident Advisor публичного API нет — интеграция не выполняется." : "4. We never bypass access restrictions or terms of use."}</p>
      </section>
    </div>
  );
}
