import Link from "next/link";
import { pageContext } from "@/lib/page";
import { tx, hrefFor } from "@/lib/atlas";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Лейблы / Labels" };

export default async function Labels({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t, atlas } = await pageContext(params);
  const list = [...atlas.d.labels].sort((a, b) => (a.foundedYear ?? 9999) - (b.foundedYear ?? 9999));
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t.map.world, href: `/${locale}` }, { label: t.nav.labels }]} />
      <h1 className="mt-6 font-display text-4xl font-semibold sm:text-6xl">{t.nav.labels}</h1>
      <ul className="mt-10 divide-y divide-line overflow-hidden rounded-2xl border border-line">
        {list.map((l) => (
          <li key={l.slug}><Link href={hrefFor(locale, "label", l.slug)} className="grid gap-2 p-4 hover:bg-card sm:grid-cols-[80px_240px_1fr] sm:items-center">
            <span className="font-mono text-sm text-cyan">{l.foundedYear ?? "—"}</span>
            <span className="font-display font-semibold">{tx(l.name, locale)}</span>
            <span className="text-sm text-ink-2">{tx(l.city ? atlas.city(l.city)?.name : atlas.country(l.country)?.name, locale)} · {tx(l.summary, locale)}</span>
          </Link></li>
        ))}
      </ul>
    </div>
  );
}
