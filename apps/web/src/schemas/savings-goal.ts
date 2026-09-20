import { z } from "zod";

/**
 * Contrato de `/me/goals`. A meta mede intenção e hábito de guarda — nunca
 * dinheiro. Não há, e não deve haver, nenhum campo de valor em nenhum lugar
 * deste schema: `monthsMet`/`targetMonths` contam meses.
 */
export const savingsGoalKindSchema = z.enum(["MONTHLY", "ENDURING"]);
export type SavingsGoalKind = z.infer<typeof savingsGoalKindSchema>;

export const savingsGoalStatusSchema = z.enum(["ACTIVE", "MET", "ENDED"]);
export type SavingsGoalStatus = z.infer<typeof savingsGoalStatusSchema>;

/**
 * Motivo opcional de não cumprimento, em opções fechadas. Nunca há texto livre
 * sobre o assunto: o app não pede relato, do mesmo jeito que o fluxo de apoio.
 */
export const savingsGoalUnmetReasonSchema = z.enum([
  "UNEXPECTED_EXPENSE",
  "INCOME_DROP",
  "CHANGED_PRIORITY",
  "PREFER_NOT_SAY",
  "OTHER",
]);
export type SavingsGoalUnmetReason = z.infer<
  typeof savingsGoalUnmetReasonSchema
>;

/** Uma meta com o progresso já derivado das declarações mensais. */
export const goalSchema = z.object({
  id: z.uuid(),
  kind: savingsGoalKindSchema,
  status: savingsGoalStatusSchema,
  startMonth: z.iso.datetime(),
  targetMonths: z.number().int().min(1),
  monthsMet: z.number().int().min(0),
  currentMonthMet: z.boolean(),
  termEndedUnmet: z.boolean(),
});

export type Goal = z.infer<typeof goalSchema>;

export const goalsSchema = z.object({
  goals: z.array(goalSchema),
});

export type Goals = z.infer<typeof goalsSchema>;

/** O 201 de criação. Sem progresso ainda — a lista é que o deriva. */
export const createdGoalSchema = z.object({
  id: z.uuid(),
  kind: savingsGoalKindSchema,
  targetMonths: z.number().int().nullable(),
  startMonth: z.iso.datetime(),
});

export type CreatedGoal = z.infer<typeof createdGoalSchema>;

export const updatedGoalSchema = z.object({
  id: z.uuid(),
  status: savingsGoalStatusSchema,
  targetMonths: z.number().int().nullable(),
});

export type UpdatedGoal = z.infer<typeof updatedGoalSchema>;
