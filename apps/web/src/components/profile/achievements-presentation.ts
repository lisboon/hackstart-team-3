import type { PersonalSummary } from "@/schemas/financial-health";
import type { Track, TrackStage } from "@/schemas/track";
import type { CoopsStage } from "@/schemas/wellbeing";

/**
 * Conquistas derivadas, calculadas de dado que já existe: nada é gravado, nada é
 * trocável. Dois tipos, e a ordem importa para o produto — trajetória é o de
 * prestígio, trilha é secundário.
 *
 * - `trajectory` (âmbar): meses declarados fechados no azul, o marco que o
 *   Sicredi valoriza. Sai de `GET /me/summary`.
 * - `track` (verde): etapas do método COOPS concluídas. Sai de `GET /me/track`.
 *
 * Não há moeda, liga, ranking nem comparação com outras pessoas: cada marco é a
 * pessoa contra o próprio caminho.
 */
export type MilestoneKind = "trajectory" | "track";

export type Milestone = {
  id: string;
  kind: MilestoneKind;
  /** Preenchido só nos marcos de trilha: a view formata o rótulo da etapa. */
  stage?: CoopsStage;
  /** Rótulo pronto (trajetória). Nos de trilha, a view compõe com `stage`. */
  label: string;
  description: string;
  achieved: boolean;
  /**
   * Quanto do caminho até o marco já foi andado, entre 0 e 1. Fica aqui, e não
   * na view, porque só este módulo conhece os limiares — a view teria de
   * reimplementá-los para desenhar a barra, e duas cópias divergem.
   *
   * Serve para dizer "falta pouco" em vez de só "não veio": um marco a caminho
   * com a barra quase cheia é informação, um cadeado cinza não é.
   */
  progress: number;
};

/**
 * Progresso de uma etapa como razão entre 0 e 1. Etapa sem peça nenhuma conta
 * como 0: não é divisão por zero nem etapa "completa por vazio".
 */
export function stageRatio(stage: Pick<TrackStage, "total" | "answered">): number {
  if (stage.total <= 0) return 0;
  return Math.min(Math.max(stage.answered / stage.total, 0), 1);
}

/** Uma etapa está concluída quando toda peça dela foi respondida, e há peça. */
export function isStageComplete(
  stage: Pick<TrackStage, "total" | "answered">,
): boolean {
  return stage.total > 0 && stage.answered >= stage.total;
}

/** Quantas etapas do COOPS a pessoa fechou. */
export function completedStages(track: Track): number {
  return track.stages.filter(isStageComplete).length;
}

/**
 * Progresso geral da trilha, para o anel do perfil: peças respondidas sobre
 * peças existentes, na trilha inteira. Sem peça nenhuma o anel fica vazio.
 */
export function trackRatio(track: Track): number {
  const total = track.stages.reduce((sum, stage) => sum + stage.total, 0);
  const answered = track.stages.reduce((sum, stage) => sum + stage.answered, 0);
  if (total <= 0) return 0;
  return Math.min(Math.max(answered / total, 0), 1);
}

/** Marcos de trajetória: meses fechados no azul que a pessoa já declarou. */
/**
 * Marcos de trajetória: constância declarada. A fonte honesta no frontend é
 * `declaredMonths` de `GET /me/summary` — meses com declaração, não "meses que
 * fecharam no azul": o resumo não expõe esse recorte, e afirmá-lo seria dizer à
 * pessoa algo que o dado não sustenta. O rótulo acompanha a verdade do dado.
 */
const TRAJECTORY_MILESTONES: readonly { at: number; label: string }[] = [
  { at: 1, label: "Primeiro mês declarado" },
  { at: 3, label: "Três meses declarados" },
  { at: 6, label: "Seis meses declarados" },
];

/** Meses declarados na janela. Nunca negativo. Sem média exposta nem escala. */
export function declaredMonthsCount(
  summary: Pick<PersonalSummary, "declaredMonths">,
): number {
  return Math.max(summary.declaredMonths, 0);
}

export function trajectoryMilestones(
  summary: Pick<PersonalSummary, "declaredMonths">,
): Milestone[] {
  const months = declaredMonthsCount(summary);
  return TRAJECTORY_MILESTONES.map(({ at, label }) => ({
    id: `trajectory-${at}`,
    kind: "trajectory" as const,
    label,
    description:
      at === 1
        ? "Você registrou o seu primeiro mês declarado."
        : `Você registrou ${at} meses declarados.`,
    achieved: months >= at,
    progress: Math.min(months / at, 1),
  }));
}

/** Marcos de trilha: uma conquista por etapa concluída do COOPS. */
export function trackMilestones(track: Track): Milestone[] {
  return track.stages.map((stage) => ({
    id: `track-${stage.stage}`,
    kind: "track" as const,
    stage: stage.stage,
    // Rótulo base sem depender do mapa de nomes: a view antepõe o nome da etapa
    // via STAGE_LABEL[stage]. Manter o formatador fora daqui deixa esta lógica
    // pura, testável sem React nem alias de módulo.
    label: "Etapa da trilha",
    description: isStageComplete(stage)
      ? "Etapa concluída na sua trilha."
      : "Esta etapa ainda faz parte do caminho à frente.",
    achieved: isStageComplete(stage),
    progress: stageRatio(stage),
  }));
}

/**
 * A imagem do troféu de um marco. Placeholders desenhados no projeto (SVG em
 * `public/trophies/`): um para trajetória, um para trilha. Trocar pela arte
 * final depois é só substituir os arquivos, sem mexer aqui.
 */
export function trophySrc(milestone: Pick<Milestone, "kind">): string {
  return milestone.kind === "trajectory"
    ? "/trophies/trajectory.svg"
    : "/trophies/track.svg";
}

/**
 * Ordem da grade: trajetória primeiro (prestígio), trilha depois. Dentro de cada
 * grupo, a ordem de definição — os marcos não conquistados ficam apagados mas
 * visíveis, porque saber o que vem depois é metade do valor.
 */
export function milestones(
  summary: Pick<PersonalSummary, "declaredMonths">,
  track: Track,
): Milestone[] {
  return [...trajectoryMilestones(summary), ...trackMilestones(track)];
}

/** Geometria do anel de progresso. Raio e circunferência para o `stroke-dasharray`. */
export function ringGeometry(size: number, stroke: number) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return { radius, circumference };
}

/** Comprimento do traço preenchido para uma razão entre 0 e 1. */
export function ringDash(circumference: number, ratio: number): number {
  return circumference * Math.min(Math.max(ratio, 0), 1);
}
