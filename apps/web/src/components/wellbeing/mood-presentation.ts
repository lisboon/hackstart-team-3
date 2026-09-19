/**
 * Cinco níveis, um toque. A escala mede o bem-estar da própria pessoa ao longo
 * do tempo; ela não ranqueia pessoas entre si.
 */
export const MOOD_LEVELS = [
  { value: "VERY_LOW", emoji: "😞", label: "Muito difícil" },
  { value: "LOW", emoji: "😕", label: "Difícil" },
  { value: "NEUTRAL", emoji: "😐", label: "Mais ou menos" },
  { value: "GOOD", emoji: "🙂", label: "Bem" },
  { value: "VERY_GOOD", emoji: "😄", label: "Muito bem" },
] as const;

export type MoodLevel = (typeof MOOD_LEVELS)[number]["value"];

export function moodLabel(mood: MoodLevel): string {
  return MOOD_LEVELS.find((level) => level.value === mood)?.label ?? "";
}

/** Na dúvida, acolher: os dois níveis mais baixos abrem o acolhimento. */
const SUFFERING: readonly MoodLevel[] = ["VERY_LOW", "LOW"];

export function isSuffering(mood: MoodLevel): boolean {
  return SUFFERING.includes(mood);
}

/**
 * Quem escolhe com quem falar é a pessoa. O gestor está na lista porque às
 * vezes é com ele que ela quer falar, e nunca em primeiro lugar: se marcar
 * sofrimento abrir conversa com quem decide sobre a carreira dela, ela para de
 * marcar e o sensor morre.
 */
export const SUPPORT_PATHS: readonly { title: string; detail: string }[] = [
  {
    title: "Assessor da agência",
    detail: "Quem já acompanha a sua conta.",
  },
  {
    title: "RH da sua empresa",
    detail: "Para o que envolve trabalho e benefícios.",
  },
  {
    title: "Canal confidencial",
    detail: "Sem passar pela chefia.",
  },
  {
    title: "Saúde ocupacional do SESI",
    detail: "Atendimento de saúde, não de desempenho.",
  },
  {
    title: "Seu gestor",
    detail: "Só se for com ele que você quiser falar.",
  },
];

export const CRISIS_LINE = {
  label: "CVV 188",
  detail: "Ligação gratuita, 24 horas, sigilosa.",
  href: "tel:188",
};

export const CARE_DISCLAIMER =
  "Este app não faz diagnóstico e não substitui atendimento profissional.";
