"use client";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useTheme } from "@/hooks/theme/use-theme";
import { cn } from "@/lib/utils";

/**
 * O MagicUI faz a transição com a View Transitions API; a escolha continua
 * sendo guardada pelo nosso hook. Sem o modo controlado os dois escreveriam
 * em chaves diferentes e o tema voltaria ao recarregar.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, apply } = useTheme();

  return (
    <AnimatedThemeToggler
      theme={theme ?? "light"}
      onThemeChange={apply}
      aria-label="Alternar tema"
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    />
  );
}
