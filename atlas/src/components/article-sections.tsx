import type { Section, LText, Locale } from "@/lib/types";
import { tx } from "@/lib/atlas";

export function ArticleSections({ sections, facts, locale, factsLabel }: { sections?: Section[]; facts?: LText[]; locale: Locale; factsLabel: string }) {
  return (
    <div className="space-y-10">
      {sections?.map((s, i) => (
        <section key={i}>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink sm:text-xl">{tx(s.heading, locale)}</h2>
          <div className="prose-atlas">
            {tx(s.body, locale).split("\n\n").map((p, j) => <p key={j}>{p}</p>)}
          </div>
        </section>
      ))}
      {facts && facts.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink sm:text-xl">{factsLabel}</h2>
          <ul className="space-y-2">
            {facts.map((f, i) => (
              <li key={i} className="flex gap-3 text-ink/90"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-acid" aria-hidden />{tx(f, locale)}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
