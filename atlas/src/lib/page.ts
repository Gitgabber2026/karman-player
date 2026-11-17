import { notFound } from "next/navigation";
import { getDict, isLocale } from "./i18n";
import { getAtlas } from "./data";
import type { Locale } from "./types";

export async function pageContext(params: Promise<{ locale: string }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [atlas] = await Promise.all([getAtlas()]);
  return { locale: locale as Locale, t: getDict(locale as Locale), atlas };
}

/** Данные атласа меняются редакторами — страницы рендерятся на сервере с кэшем данных 60 с. */
export const revalidate = 60;
