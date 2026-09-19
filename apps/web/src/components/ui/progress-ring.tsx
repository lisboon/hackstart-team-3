import type { ReactNode } from "react";

/**
 * Anel de progresso. É a mesma forma do anel da trilha, reusável em escala: o
 * perfil o mostra pequeno em volta do ícone de pessoa. Puro visual — recebe uma
 * razão entre 0 e 1 e desenha; não conhece domínio nem transporte.
 *
 * O progresso não pode ser indicado só pela cor (WCAG 1.4.1): quem usa o anel
 * passa um `label` que descreve o progresso em texto, e o miolo (`children`)
 * fica visível. O SVG é `aria-hidden`; o texto acessível vem do `label`.
 */
export function ProgressRing({
  ratio,
  size = 120,
  stroke = 10,
  label,
  children,
}: {
  ratio: number;
  size?: number;
  stroke?: number;
  label: string;
  children?: ReactNode;
}) {
  const clamped = Math.min(Math.max(ratio, 0), 1);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * clamped;

  return (
    <div
      role="img"
      aria-label={label}
      className="relative inline-grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg
        aria-hidden
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
