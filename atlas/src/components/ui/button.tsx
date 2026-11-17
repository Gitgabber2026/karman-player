import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        primary: "bg-ink text-bg hover:bg-acid",
        violet: "bg-violet text-ink hover:bg-violet/85",
        outline: "border border-line-2 text-ink hover:border-cyan hover:text-cyan bg-bg/40 backdrop-blur",
        ghost: "text-ink-2 hover:text-ink hover:bg-card",
        chip: "border border-line text-ink-2 hover:text-ink hover:border-line-2 bg-bg-2",
        chipActive: "border border-cyan/60 text-cyan bg-cyan/10",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-7 text-sm tracking-wide",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "outline", size: "md" },
  }
);

type Common = VariantProps<typeof buttonVariants> & { className?: string };

export function Button({ className, variant, size, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & Common) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function ButtonLink({ className, variant, size, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & Common & { href: string }) {
  return <Link href={href} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
