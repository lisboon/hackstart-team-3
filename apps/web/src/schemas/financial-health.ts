import { z } from "zod";

/**
 * Contrato de `GET /me/summary` e `POST /me/self-report` (docs/contratos.md).
 * A situação é ordinal no servidor, mas a escala numérica não pertence à tela:
 * ela existe apenas para a média móvel da própria pessoa.
 */
export const selfReportSituationSchema = z.enum(
  ["SURPLUS", "BREAK_EVEN", "SLIGHT_SHORTFALL", "SEVERE_SHORTFALL"],
  { error: "Escolha como o mês fechou para você." },
);

export type SelfReportSituation = z.infer<typeof selfReportSituationSchema>;

/**
 * `null` em `currentSituation` significa mês ainda não declarado, e `null` nas
 * médias significa histórico insuficiente. Nenhum dos dois é zero: zero é
 * `SEVERE_SHORTFALL`, o pior resultado possível.
 */
export const personalSummarySchema = z.object({
  currentMonth: z.iso.datetime(),
  currentSituation: selfReportSituationSchema.nullable(),
  recentAverage: z.number().nullable(),
  previousAverage: z.number().nullable(),
  declaredMonths: z.number().int().min(0),
});

export type PersonalSummary = z.infer<typeof personalSummarySchema>;

/** O corpo da declaração leva só a situação: mês e identidade saem da sessão. */
export const selfReportSchema = z.object({
  situation: selfReportSituationSchema,
});

export type SelfReportValues = z.infer<typeof selfReportSchema>;
