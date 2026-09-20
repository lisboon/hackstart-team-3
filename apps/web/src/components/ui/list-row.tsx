import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Linha de uma lista de ajustes: ícone, rótulo, dica e um acessório à direita.
 *
 * É um `button`, e não um `asChild` como o do `Button`: aqui o conteúdo é
 * estruturado (rótulo em cima, dica embaixo), e o `Slot` do Radix substitui as
 * próprias crianças do elemento filho em vez de injetar as do slot — um
 * `<ListRow asChild><Link/></ListRow>` sairia sem texto nenhum. No dia em que
 * uma linha precisar navegar, `Slottable` resolve; até então isto é o que tem
 * consumidor.
 *
 * `min-h-12` em vez de `min-h-11`: são 48px, porque as linhas ficam encostadas
 * uma na outra e 44px justos fazem o dedo errar a vizinha.
 */
export function ListRow({
  label,
  hint,
  icon,
  trailing,
  className,
  ...props
}: {
  label: string;
  hint?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
} & Omit<ComponentProps<"button">, "children">) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-primary">
          {icon}
        </span>
      )}
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </span>
      {trailing && (
        <span className="shrink-0 text-muted-foreground">{trailing}</span>
      )}
    </button>
  );
}
