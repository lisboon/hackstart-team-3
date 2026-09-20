import { z } from "zod";

/**
 * Contrato de `GET /organizations/current/indicators`.
 *
 * Todo indicador é anulável e o servidor já decidiu o que pode sair. `null`
 * significa **não há dado suficiente para mostrar** — nunca zero, e nunca uma
 * dica de qual dos dois motivos foi: dizer qual já entregaria o tamanho do
 * grupo.
 */
const periodIndicatorsSchema = z.object({
  tightRatio: z.number().nullable(),
  averageMood: z.number().nullable(),
});

export const unitIndicatorsSchema = z.object({
  suppressed: z.boolean(),
  headcount: z.number().nullable(),
  reach: z.number().nullable(),
  active: z.number().nullable(),
  frequency: z.number().nullable(),
  tightRatio: z.number().nullable(),
  averageMood: z.number().nullable(),
  previous: periodIndicatorsSchema.nullable(),
});

export type UnitIndicators = z.infer<typeof unitIndicatorsSchema>;

/**
 * Contrato de `GET /organizations/current`. O perfil usa só o nome da unidade
 * da sessão. Campos extras do DTO (slug, timestamps) são ignorados de
 * propósito. A organização vem da sessão, decidida no servidor: nunca por query.
 */
export const currentOrganizationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export type CurrentOrganization = z.infer<typeof currentOrganizationSchema>;
