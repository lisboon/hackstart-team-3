import { z } from "zod";
import { coopsStageSchema } from "@/schemas/wellbeing";

/**
 * Contrato de `GET /me/track` (docs/contratos.md, #43). Progresso por etapa do
 * método COOPS: quantas peças a etapa tem e quantas a pessoa já respondeu. As
 * cinco etapas vêm sempre, mesmo com `answered: 0` — a trilha mostra o caminho
 * inteiro, inclusive o que ainda está trancado.
 */
export const trackStageSchema = z.object({
  stage: coopsStageSchema,
  total: z.number().int().min(0),
  answered: z.number().int().min(0),
});

export type TrackStage = z.infer<typeof trackStageSchema>;

export const trackSchema = z.object({
  stages: z.array(trackStageSchema),
});

export type Track = z.infer<typeof trackSchema>;
