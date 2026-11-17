import { PlaceholderArt } from "./placeholder-art";
import type { MediaAsset } from "@/lib/types";

export function PageHero({ kicker, title, subtitle, seed, media, kindLabel, children, placeholderLabel }: {
  kicker: React.ReactNode; title: string; subtitle?: string; seed: string; media?: MediaAsset; kindLabel: string; children?: React.ReactNode; placeholderLabel: string;
}) {
  return (
    <header className="relative isolate overflow-hidden border-b border-line">
      <div className="absolute inset-0 -z-10">
        {media ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt={media.alt.ru} className="h-full w-full object-cover opacity-50" />
        ) : (
          <PlaceholderArt seed={seed} label={placeholderLabel} kindLabel={kindLabel} className="h-full w-full opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/30" />
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6 sm:pt-32 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-ink-2">{kicker}</div>
        <h1 className="font-display text-4xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-7xl">{title}</h1>
        {subtitle && <p className="mt-5 max-w-3xl text-base leading-relaxed text-ink/85 sm:text-lg">{subtitle}</p>}
        {children && <div className="mt-6 flex flex-wrap items-center gap-3">{children}</div>}
      </div>
    </header>
  );
}
