import type { MoodScale } from "@/schemas/wellbeing";

/**
 * Cinco níveis, um toque. O número é o valor do contrato, de 1 a 5 com 1 no
 * pior; a tela mostra só emoji e palavra.
 */
export const MOOD_LEVELS: readonly {
  value: MoodScale;
  emoji: string;
  label: string;
}[] = [
  { value: 1, emoji: "😞", label: "Muito difícil" },
  { value: 2, emoji: "😕", label: "Difícil" },
  { value: 3, emoji: "😐", label: "Mais ou menos" },
  { value: 4, emoji: "🙂", label: "Bem" },
  { value: 5, emoji: "😄", label: "Muito bem" },
];

export function moodLabel(mood: MoodScale): string {
  return MOOD_LEVELS.find((level) => level.value === mood)?.label ?? "";
}

/** Na dúvida, acolher: os dois níveis mais baixos abrem o acolhimento. */
export function isSuffering(mood: MoodScale): boolean {
  return mood <= 2;
}

/**
 * PENDENTE DE VALIDAÇÃO (#17). Ainda não confirmamos com a Sicredi quais
 * destes canais existem. Confirmar antes da demo.
 *
 * Por isso cada linha descreve uma possibilidade, não uma garantia: oferecer
 * apoio que não atende é pior que não oferecer.
 */
export const SUPPORT_PATHS: readonly { title: string; detail: string }[] = [
  {
    title: "Assessor da agência",
    detail: "Se você tem atendimento na sua agência.",
  },
  {
    title: "RH da sua empresa",
    detail: "Quando o assunto passa por trabalho ou benefícios.",
  },
  {
    title: "Canal confidencial",
    detail: "Onde existir, não passa pela chefia.",
  },
  {
    title: "Saúde ocupacional do SESI",
    detail: "Onde houver atendimento de saúde do SESI.",
  },
  {
    title: "Seu gestor",
    detail: "Só se for com ele que você quiser falar.",
  },
];

/** Serviço público, gratuito e 24h: validado por definição, fica em destaque. */
export const CRISIS_LINE = {
  label: "CVV 188",
  detail: "Ligação gratuita, 24 horas, sigilosa.",
  href: "tel:188",
};

export const CARE_DISCLAIMER =
  "Este app não faz diagnóstico e não substitui atendimento profissional.";
