import type { LText, Section, Source, SourceRef } from "@/lib/types";

/** Локализованная строка */
export const t = (ru: string, en?: string): LText => (en ? { ru, en } : { ru });

export const sec = (headingRu: string, bodyRu: string, headingEn?: string, bodyEn?: string): Section => ({
  heading: t(headingRu, headingEn),
  body: t(bodyRu, bodyEn),
});

const registry = new Map<string, Source>();

/**
 * Ссылка на статью Википедии как на источник для редакционной сверки.
 * Это указатель «где проверять», а не автоматическое подтверждение:
 * сущности остаются в статусе unverified до ручной проверки редактором.
 */
export function wiki(title: string, lang: "en" | "ru" | "de" = "en", note?: string): SourceRef {
  const id = `wikipedia-${lang}:${title}`;
  if (!registry.has(id)) {
    registry.set(id, {
      id,
      title: title.replace(/_/g, " "),
      url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title).replace(/%2F/g, "/")}`,
      publisher: `Wikipedia (${lang})`,
      kind: "encyclopedia",
    });
  }
  return note ? { id, note } : { id };
}

/** Официальный сайт как источник */
export function official(url: string, publisher: string, note?: string): SourceRef {
  const id = `official:${url}`;
  if (!registry.has(id)) {
    registry.set(id, { id, title: publisher, url, publisher, kind: "official" });
  }
  return note ? { id, note } : { id };
}

export function allSources(): Source[] {
  return [...registry.values()];
}
