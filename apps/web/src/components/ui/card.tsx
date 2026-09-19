import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "grid min-w-0 gap-4 rounded-2xl border border-border bg-card p-5 md:p-6",
        className,
      )}
      {...props}
    />
  );
}
