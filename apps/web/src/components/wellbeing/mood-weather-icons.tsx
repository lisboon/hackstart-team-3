import type { ComponentType } from "react";
import type { MoodScale } from "@/schemas/wellbeing";

/**
 * Os ícones de clima da pesquisa de humor, iguais aos do mock `home.html`
 * (traço fino, `currentColor`, sem preenchimento). A metáfora é o tempo, não a
 * carinha: o clima descreve o dia sem pedir que a pessoa se classifique. A cor
 * nunca é o único sinal — o rótulo vai no `aria-label` de cada botão.
 *
 * Cada nível de 1 (pior) a 5 (melhor) tem o seu, na ordem do mock:
 * Tempestade · Chuva · Nublado · Brisa e Renovação · Sol.
 */
type WeatherIcon = ComponentType<{ className?: string }>;

const base = {
  fill: "none" as const,
  stroke: "currentColor",
  viewBox: "0 0 24 24",
};

/** 1 — Tempestade: nuvem com pingos fortes. */
function StormIcon({ className }: { className?: string }) {
  return (
    <svg className={className} strokeWidth={1.8} {...base} aria-hidden>
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M8 19v1M12 19v1M16 19v1" />
    </svg>
  );
}

/** 2 — Chuva leve: nuvem com dois pingos. */
function RainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} strokeWidth={1.8} {...base} aria-hidden>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      <path d="M11 21v.01M15 21v.01" />
    </svg>
  );
}

/** 3 — Nublado: só a nuvem. */
function CloudIcon({ className }: { className?: string }) {
  return (
    <svg className={className} strokeWidth={1.8} {...base} aria-hidden>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  );
}

/** 4 — Brisa e renovação: rajadas de vento. */
function BreezeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...base}
      aria-hidden
    >
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  );
}

/** 5 — Sol: círculo com raios. */
function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} strokeWidth={1.8} {...base} aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

export const WEATHER_ICON: Record<MoodScale, WeatherIcon> = {
  1: StormIcon,
  2: RainIcon,
  3: CloudIcon,
  4: BreezeIcon,
  5: SunIcon,
};
