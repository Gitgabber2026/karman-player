import { cn } from "@/lib/utils";

export function Card({ className, children, as: As = "div" }: { className?: string; children: React.ReactNode; as?: "div" | "article" | "section" | "li" }) {
  return <As className={cn("rounded-2xl border border-line bg-card", className)}>{children}</As>;
}
