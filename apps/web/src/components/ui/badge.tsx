import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Etiqueta curta de estado ou de pertencimento. O texto é o indicador; a cor é
 * reforço (WCAG 1.4.1). Por isso não existe variante "só ícone" nem variante
 * que dependa de vermelho para significar erro.
 *
 * `achieved` usa o âmbar dos marcos de trajetória, o de prestígio no produto.
 */
const variants = cva(
  "inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "border-border bg-muted text-muted-foreground",
        achieved:
          "border-[var(--achievement-trajectory)] bg-muted text-foreground",
        pending: "border-border text-muted-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof variants>) {
  return <span className={cn(variants({ variant }), className)} {...props} />;
}
