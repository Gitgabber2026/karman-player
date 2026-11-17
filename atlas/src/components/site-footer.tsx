import Link from "next/link";
import type { Locale } from "@/lib/types";
import type { Dict } from "@/lib/i18n";

export function SiteFooter({ locale, t }: { locale: Locale; t: Dict }) {
  const cols: [string, [string, string][]][] = [
    [t.nav.map, [["map", t.nav.map], ["countries", t.nav.countries], ["routes", t.nav.routes], ["history", t.nav.history]]],
    [t.common.related, [["clubs", t.nav.clubs], ["festivals", t.nav.festivals], ["events", t.nav.events], ["connections", t.nav.connections]]],
    [t.nav.genres, [["genres", t.nav.genres], ["artists", t.nav.artists], ["labels", t.nav.labels], ["search", t.nav.search]]],
  ];
  return (
    <footer className="mt-24 border-t border-line bg-bg-2/50">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-8">
        <div>
          <div className="font-display text-lg font-semibold uppercase tracking-[0.12em]">Electronic Music<br />World Atlas</div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-2">{t.footer.honesty}</p>
          <Link href={`/${locale}/about`} className="mt-4 inline-block text-sm text-cyan hover:text-acid">{t.footer.data} →</Link>
        </div>
        {cols.map(([title, links]) => (
          <div key={title}>
            <div className="mb-3 font-mono text-xs uppercase tracking-widest text-ink-3">{title}</div>
            <ul className="space-y-2">
              {links.map(([seg, label]) => (
                <li key={seg}><Link href={`/${locale}/${seg}`} className="text-sm text-ink-2 hover:text-ink">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line px-4 py-5 text-center text-xs text-ink-3">
        Map data © OpenStreetMap contributors · Basemap © CARTO · Borders: Natural Earth
      </div>
    </footer>
  );
}
