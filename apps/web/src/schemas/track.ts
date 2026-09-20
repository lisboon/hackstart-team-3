import { z } from "zod";
import { coopsStageSchema } from "./wellbeing";

/**
 * Contrato de `GET /me/track` (docs/contratos.md, #43). Progresso por etapa do
 * método COOPS: quantas peças a etapa tem e quantas a pessoa já respondeu. As
 * cinco etapas vêm sempre, mesmo com `answered: 0` — a trilha mostra o caminho
 * inteiro, inclusive o que ainda está trancado.
 *
 * Este é o único contrato da trilha. Houve um segundo, em `schemas/profile.ts`,
 * com os mesmos campos e outro nome: a tela da trilha validava por um e o perfil
 * pelo outro, e uma mudança de contrato teria de ser lembrada duas vezes.
 */
export const trackStageSchema = z.object({
  stage: coopsStageSchema,
  total: z.number().int().min(0),
  answered: z.number().int().min(0),
});

export const trackSchema = z.object({
  stages: z.array(trackStageSchema),
});

export type TrackStage = z.infer<typeof trackStageSchema>;
export type Track = z.infer<typeof trackSchema>;
