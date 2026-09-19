import type {
  PersonalSummary,
  SelfReportSituation,
} from "@/schemas/financial-health";

export const SITUATION_LABEL: Readonly<Record<SelfReportSituation, string>> = {
  SURPLUS: "Sobrou",
  BREAK_EVEN: "Deu exatamente",
  SLIGHT_SHORTFALL: "Faltou um pouco",
  SEVERE_SHORTFALL: "Faltou bastante",
};

export const SITUATION_CHOICES: readonly {
  value: SelfReportSituation;
  label: string;
  hint: string;
}[] = [
  {
    value: "SURPLUS",
    label: SITUATION_LABEL.SURPLUS,
    hint: "As contas fecharam e ainda ficou algum dinheiro.",
  },
  {
    value: "BREAK_EVEN",
    label: SITUATION_LABEL.BREAK_EVEN,
    hint: "As contas fecharam, sem sobra.",
  },
  {
    value: "SLIGHT_SHORTFALL",
    label: SITUATION_LABEL.SLIGHT_SHORTFALL,
    hint: "Faltou pouco para fechar as contas.",
  },
  {
    value: "SEVERE_SHORTFALL",
    label: SITUATION_LABEL.SEVERE_SHORTFALL,
    hint: "Faltou bastante para fechar as contas.",
  },
];

/** A janela do resumo, conforme o contrato: três meses contra os três anteriores. */
export const SUMMARY_WINDOW_MONTHS = 6;

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * `currentMonth` é o primeiro dia do mês em UTC. Formatar no fuso local jogaria
 * a data para o mês anterior em qualquer offset negativo.
 */
export function formatMonth(isoMonth: string): string {
  const label = monthFormatter.format(new Date(isoMonth));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export type Trajectory = "lighter" | "steady" | "tighter";

/** Meia casa numa escala de quatro degraus: abaixo disso é ruído, não trajetória. */
const MEANINGFUL_CHANGE = 0.5;

/**
 * A comparação só existe quando as duas médias são números. Com `null` de um
 * lado não há tendência: ausência de declaração não é resultado ruim.
 */
export function compareTrajectory(
  summary: Pick<PersonalSummary, "recentAverage" | "previousAverage">,
): Trajectory | null {
  const { recentAverage, previousAverage } = summary;
  if (recentAverage === null || previousAverage === null) return null;
  const change = recentAverage - previousAverage;
  if (Math.abs(change) < MEANINGFUL_CHANGE) return "steady";
  return change > 0 ? "lighter" : "tighter";
}

/**
 * A tela compara, mas não acusa: um período mais difícil é descrito como
 * apertado, nunca como piora da pessoa.
 */
export const TRAJECTORY_MESSAGE: Readonly<Record<Trajectory, string>> = {
  lighter:
    "Comparados com os três meses anteriores, esses últimos foram mais folgados.",
  steady:
    "Comparados com os três meses anteriores, esses últimos seguiram parecidos.",
  tighter:
    "Comparados com os três meses anteriores, esses últimos foram mais apertados.",
};

/** Traduz a média para as palavras da própria pessoa, sem expor a escala. */
export function describeAverage(average: number): string {
  if (average >= 2.5) return "meses em que sobrou";
  if (average >= 1.5) return "meses que fecharam no limite";
  if (average >= 0.5) return "meses em que faltou um pouco";
  return "meses em que faltou bastante";
}

const HIGHEST_SITUATION_SCORE = 3;

/** Largura da barra comparativa. Proporção, nunca número na tela. */
export function averageWidth(average: number): string {
  const ratio = Math.min(Math.max(average / HIGHEST_SITUATION_SCORE, 0), 1);
  return `${Math.round(ratio * 100)}%`;
}
