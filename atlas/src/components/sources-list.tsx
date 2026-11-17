import type { Atlas } from "@/lib/atlas";
import type { SourceRef, VerificationStatus } from "@/lib/types";
import type { Dict } from "@/lib/i18n";
import { VerificationBadge } from "./verification-badge";
import { ExternalLink } from "lucide-react";
import { safeUrl } from "@/lib/utils";

export function SourcesList({ atlas, refs, verification, checkedAt, t, locale }: { atlas: Atlas; refs: SourceRef[]; verification: VerificationStatus; checkedAt: string | null; t: Dict; locale: "ru" | "en" }) {
  const list = atlas.sourcesOf(refs);
  return (
    <section aria-labelledby="sources-h" className="rounded-2xl border border-line bg-bg-2 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="sources-h" className="font-display text-sm uppercase tracking-[0.18em] text-ink-2">{t.common.sources}</h2>
        <VerificationBadge status={verification} t={t} />
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-ink-2">{t.common.noSources}</p>
      ) : (
        <ul className="space-y-2">
          {list.map((s) => {
            const href = safeUrl(s.source.url);
            return (
              <li key={s.id} className="text-sm">
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-ink hover:text-cyan">
                    {s.source.title}
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                ) : (
                  s.source.title
                )}
                <span className="ml-2 text-ink-3">{s.source.publisher}</span>
                {s.note && <span className="block text-xs text-ink-3">{s.note}</span>}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 border-t border-line pt-3 text-xs text-ink-3">
        {t.common.lastChecked}: {checkedAt ? new Date(checkedAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB") : t.common.notChecked}
      </p>
    </section>
  );
}
