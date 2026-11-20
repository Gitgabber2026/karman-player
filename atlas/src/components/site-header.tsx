"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Globe2 } from "lucide-react";
import type { Locale } from "@/lib/types";
import type { Dict } from "@/lib/i18n";
import { GlobalSearch } from "./global-search";
import { cn } from "@/lib/utils";

export function SiteHeader({ locale, t }: { locale: Locale; t: Pick<Dict, "nav" | "kinds" | "map" | "common" | "siteName"> }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const other: Locale = locale === "ru" ? "en" : "ru";
  const switchHref = pathname.replace(/^\/(ru|en)/, `/${other}`);
  const nav = [
    ["map", t.nav.map], ["countries", t.nav.countries], ["clubs", t.nav.clubs], ["festivals", t.nav.festivals], ["events", t.nav.events],
    ["genres", t.nav.genres], ["artists", t.nav.artists], ["history", t.nav.history], ["routes", t.nav.routes], ["connections", t.nav.connections],
  ] as const;
  const isActive = (seg: string) => pathname.startsWith(`/${locale}/${seg}`);
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href={`/${locale}`} className="flex shrink-0 items-center gap-2.5" aria-label={t.siteName}>
          <span className="relative grid h-8 w-8 place-items-center rounded-full border border-cyan/50">
            <span className="absolute h-2 w-2 rounded-full bg-acid" />
            <span className="absolute inset-1 rounded-full border border-violet/60" />
          </span>
          <span className="hidden font-display text-[13px] font-semibold uppercase leading-none tracking-[0.14em] sm:block">
            EM World<br /><span className="text-ink-2">Atlas</span>
          </span>
        </Link>
        <nav className="hidden flex-1 items-center gap-1 2xl:flex" aria-label="primary">
          {nav.map(([seg, label]) => (
            <Link key={seg} href={`/${locale}/${seg}`} className={cn("rounded-full px-3 py-1.5 text-sm text-ink-2 hover:text-ink", isActive(seg) && "bg-card text-ink")}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <GlobalSearch locale={locale} placeholder={t.map.searchPlaceholder} kindLabels={t.kinds} nothing={t.common.nothing} className="hidden w-64 md:block xl:w-80" />
          <Link href={`/${locale}/me`} className="hidden whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-ink-2 hover:text-ink lg:block">{t.nav.me}</Link>
          <Link href={switchHref} hrefLang={other} className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1.5 text-xs uppercase text-ink-2 hover:text-ink" aria-label={other === "en" ? "English" : "Русский"}>
            <Globe2 className="h-3.5 w-3.5" aria-hidden /> {other}
          </Link>
          <button className="grid h-9 w-9 place-items-center rounded-full border border-line 2xl:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="menu">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-line bg-bg px-4 pb-6 pt-4 2xl:hidden">
          <GlobalSearch locale={locale} placeholder={t.map.searchPlaceholder} kindLabels={t.kinds} nothing={t.common.nothing} className="mb-4 md:hidden" />
          <nav className="grid grid-cols-2 gap-1" aria-label="mobile">
            {[...nav, ["labels", t.nav.labels] as const, ["me", t.nav.me] as const, ["search", t.nav.search] as const, ["about", t.nav.about] as const].map(([seg, label]) => (
              <Link key={seg} href={`/${locale}/${seg}`} onClick={() => setOpen(false)} className={cn("rounded-xl px-3 py-2.5 text-sm text-ink-2 hover:bg-card hover:text-ink", isActive(seg) && "bg-card text-ink")}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
