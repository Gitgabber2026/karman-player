import Link from "next/link";
import { PlaceholderArt } from "./placeholder-art";
import type { MediaAsset } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EntityCard({
  href, title, subtitle, meta, kindLabel, seed, media, className, badges, aspect = "aspect-[4/3]",
}: {
  href: string; title: string; subtitle?: string; meta?: string; kindLabel: string; seed: string; media?: MediaAsset; className?: string; badges?: React.ReactNode; aspect?: string;
}) {
  return (
    <Link href={href} className={cn("group block overflow-hidden rounded-2xl border border-line bg-card transition-colors hover:border-line-2", className)}>
      <div className={cn("relative", aspect)}>
        {media ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.thumbUrl ?? media.url} alt={media.alt.ru} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        ) : (
          <PlaceholderArt seed={seed} label={title} kindLabel={kindLabel} className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.03]" />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-semibold leading-tight text-ink group-hover:text-acid">{title}</h3>
        </div>
        {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
        {meta && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-3">{meta}</p>}
        {badges && <div className="mt-3 flex flex-wrap gap-1.5">{badges}</div>}
      </div>
    </Link>
  );
}
