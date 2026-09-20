import { cn } from "@/lib/utils";

/**
 * Barra de progresso horizontal. É a forma achatada do `ProgressRing`, para
 * quando o progresso acompanha uma linha de texto em vez de um retrato.
 *
 * O rótulo é obrigatório quando a barra informa algo, porque progresso não pode
 * ser indicado só por cor e comprimento (WCAG 1.4.1) — e é texto pronto, nunca
 * uma porcentagem montada aqui: em várias telas deste produto o número exato é
 * justamente o que não se mostra. Passar `decorative` diz que o texto ao lado
 * já conta a história e a barra é ornamento.
 */
export function ProgressBar({
  ratio,
  label,
  decorative = false,
  className,
}: {
  ratio: number;
  label?: string;
  decorative?: boolean;
  className?: string;
}) {
  const clamped = Math.min(Math.max(ratio, 0), 1);
  return (
    <div
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500"
        style={{ width: `${Math.round(clamped * 100)}%` }}
      />
    </div>
  );
}
