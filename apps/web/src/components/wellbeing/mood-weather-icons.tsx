import type { MoodScale } from "@/schemas/wellbeing";

/**
 * Ícones do tempo para a pergunta de humor, no traço do `home.html`: contorno
 * fino, sem preenchimento, que herda a cor do texto do botão. São desenhos
 * simples (tempestade → sol), a metáfora do tempo que não acusa a pessoa.
 *
 * A cor sozinha nunca indica o estado: cada botão traz também o rótulo em
 * texto (ver MoodPrompt). Estes SVGs são decorativos, então `aria-hidden`.
 */
const COMMON = {
  className: "size-6",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

function Storm() {
  return (
    <svg {...COMMON}>
      <path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2" />
      <path d="M13 12l-3 5h4l-3 5" />
    </svg>
  );
}

function Rain() {
  return (
    <svg {...COMMON}>
      <path d="M17.5 15H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 0 1 0 9Z" />
      <path d="M9 19v1M13 19v1M17 19v1" />
    </svg>
  );
}

function Cloud() {
  return (
    <svg {...COMMON}>
      <path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  );
}

function Breeze() {
  return (
    <svg {...COMMON}>
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  );
}

function Sun() {
  return (
    <svg {...COMMON}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

/** O ícone do tempo para cada nível da escala (1 pior … 5 melhor). */
export const WEATHER_ICON: Readonly<Record<MoodScale, () => React.JSX.Element>> =
  {
    1: Storm,
    2: Rain,
    3: Cloud,
    4: Breeze,
    5: Sun,
  };
