import { pageContext } from "@/lib/page";
import { mapProps } from "@/lib/map-props";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MyWorld } from "@/components/my-world";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Electronic World" };

export default async function Me({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t, atlas } = await pageContext(params);
  const mp = mapProps(atlas, locale, t);
  const ru = locale === "ru";
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t.map.world, href: `/${locale}` }, { label: t.nav.me }]} />
      <h1 className="mb-8 mt-6 font-display text-4xl font-semibold sm:text-6xl">My Electronic World</h1>
      <MyWorld locale={locale} features={atlas.mapFeatures(locale)} countries={mp.countries} continents={mp.continents} labels={mp.labels}
        text={{
          favorites: ru ? "Избранное" : "Favourites", visited: ru ? "Посещённые" : "Visited", saved: ru ? "Сохранённые события" : "Saved events",
          empty: ru ? "Пока пусто. Добавляйте клубы, фестивали, города и артистов кнопками «В избранное» и «Был(а) здесь» на их страницах." : "Nothing yet. Use the favourite and visited buttons on pages.",
          map: ru ? "Персональная карта музыкальных путешествий" : "Personal travel map", clear: ru ? "Очистить всё" : "Clear all",
          note: ru ? "Данные хранятся только в этом браузере. Синхронизация с аккаунтом — в плане разработки." : "Stored only in this browser. Account sync is planned.",
          kinds: t.kinds,
        }} />
    </div>
  );
}
