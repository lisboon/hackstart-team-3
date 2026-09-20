import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Bloco de um número da grade do perfil. `dl` fica com quem monta a grade; aqui
 * é só o par, para que a lista inteira seja uma definição e não uma pilha de
 * divs — um leitor de tela anuncia "Meses declarados, 4".
 *
 * O `dt` vem antes do `dd` no DOM porque é o que a especificação da `dl` pede
 * para associar termo e definição; `flex-col-reverse` põe o valor em cima na
 * tela sem trocar a ordem do documento.
 *
 * O valor vem em `tabular-nums` porque a grade tem dois por linha e números de
 * larguras diferentes fazem as colunas dançarem entre um mês e o seguinte.
 */
export function StatTile({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col-reverse gap-1 rounded-xl border border-border bg-card p-3",
        className,
      )}
    >
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
