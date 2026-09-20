import type {
  SavingsGoalKind,
  SavingsGoalUnmetReason,
} from "@/schemas/savings-goal";

export const GOAL_KIND_LABEL: Readonly<Record<SavingsGoalKind, string>> = {
  MONTHLY: "Guardar este mês",
  ENDURING: "Manter a guarda por alguns meses",
};

/**
 * Motivos em opções fechadas. Nunca há texto livre sobre o assunto: o produto
 * não pede relato. "Outro motivo" é rótulo fechado, sem campo aberto.
 */
export const UNMET_REASONS: readonly {
  value: SavingsGoalUnmetReason;
  label: string;
}[] = [
  { value: "UNEXPECTED_EXPENSE", label: "Apareceu uma despesa fora do previsto" },
  { value: "INCOME_DROP", label: "A renda caiu neste período" },
  { value: "CHANGED_PRIORITY", label: "Mudei minha prioridade agora" },
  { value: "OTHER", label: "Outro motivo" },
  { value: "PREFER_NOT_SAY", label: "Prefiro não dizer" },
];
