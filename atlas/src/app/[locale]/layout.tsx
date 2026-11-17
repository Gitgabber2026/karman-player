import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "@fontsource-variable/inter";
import "@fontsource-variable/unbounded";
import "@fontsource-variable/jetbrains-mono";
import "../globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getDict, isLocale, locales } from "@/lib/i18n";
import { getAtlasState } from "@/lib/data";

export const viewport: Viewport = { themeColor: "#080A10", width: "device-width", initialScale: 1 };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    metadataBase: new URL(site),
    title: { default: "Electronic Music World Atlas", template: "%s — Electronic Music World Atlas" },
    description:
      locale === "en"
        ? "Interactive world atlas of electronic music, club culture and festivals."
        : "Интерактивный мировой атлас электронной музыки, клубной культуры и фестивалей.",
    alternates: { languages: { ru: "/ru", en: "/en" } },
    openGraph: { siteName: "Electronic Music World Atlas", type: "website" },
    icons: { icon: "/icon.svg" },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const state = await getAtlasState();
  return (
    <html lang={locale}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg">
          {locale === "ru" ? "К содержимому" : "Skip to content"}
        </a>
        <Providers>
          <SiteHeader locale={locale} t={{ nav: t.nav, kinds: t.kinds, map: t.map, common: t.common, siteName: t.siteName }} />
          {state.mode === "seed" && (
            <div role="status" className="border-b border-warn/30 bg-warn/5 px-4 py-2 text-center text-xs text-warn">
              {state.error ? t.dataMode.error : t.dataMode.seed}
            </div>
          )}
          <main id="main">{children}</main>
          <SiteFooter locale={locale} t={t} />
        </Providers>
      </body>
    </html>
  );
}
