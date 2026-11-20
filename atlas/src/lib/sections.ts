import type { Section } from "./types";

/**
 * Текстовый формат разделов статьи для редактора:
 *   ## Заголовок
 *   Абзац…
 *
 *   Абзац…
 * Русская и английская версии редактируются отдельно и сопоставляются по порядку.
 */
export function parseSections(text: string): { heading: string; body: string }[] {
  const out: { heading: string; body: string }[] = [];
  for (const block of text.replace(/\r\n/g, "\n").split(/^##\s+/m)) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const nl = trimmed.indexOf("\n");
    const heading = (nl === -1 ? trimmed : trimmed.slice(0, nl)).trim();
    const body = nl === -1 ? "" : trimmed.slice(nl + 1).trim();
    if (heading && body) out.push({ heading, body });
  }
  return out;
}

export function sectionsToText(sections: Section[] | undefined, lang: "ru" | "en"): string {
  return (sections ?? [])
    .map((s) => (lang === "ru" ? `## ${s.heading.ru}\n${s.body.ru}` : s.heading.en || s.body.en ? `## ${s.heading.en ?? ""}\n${s.body.en ?? ""}` : ""))
    .filter(Boolean)
    .join("\n\n");
}

/** Объединяет RU и EN разделы; английский перевод привязывается по индексу. */
export function mergeSections(ru: string, en: string): Section[] {
  const r = parseSections(ru);
  const e = parseSections(en);
  return r.map((s, i) => ({
    heading: e[i] ? { ru: s.heading, en: e[i].heading } : { ru: s.heading },
    body: e[i] ? { ru: s.body, en: e[i].body } : { ru: s.body },
  }));
}
