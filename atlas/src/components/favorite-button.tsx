"use client";
import { Heart, Check, Bookmark } from "lucide-react";
import { useFavorites, type FavKind } from "@/lib/favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({ entity, slug, title, labels, kinds = ["favorite"] }: {
  entity: string; slug: string; title: string; labels: Record<FavKind, string> & { favorited: string }; kinds?: FavKind[];
}) {
  const { has, toggle, ready } = useFavorites();
  const icons = { favorite: Heart, visited: Check, saved: Bookmark };
  return (
    <div className="flex flex-wrap gap-2">
      {kinds.map((k) => {
        const on = ready && has(k, entity, slug);
        const Icon = icons[k];
        return (
          <button
            key={k}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(k, entity, slug, title)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
              on ? "border-acid/60 bg-acid/10 text-acid" : "border-line-2 bg-bg/40 text-ink hover:border-cyan hover:text-cyan"
            )}
          >
            <Icon className={cn("h-4 w-4", on && k === "favorite" && "fill-acid")} aria-hidden />
            {on && k === "favorite" ? labels.favorited : labels[k]}
          </button>
        );
      })}
    </div>
  );
}
