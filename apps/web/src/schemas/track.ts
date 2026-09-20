import { z } from "zod";
import { coopsStageSchema } from "./wellbeing";

export const trackStageSchema = z.object({
  stage: coopsStageSchema,
  total: z.number().int().min(0),
  answered: z.number().int().min(0),
});

export const trackResponseSchema = z.object({
  stages: z.array(trackStageSchema),
});

export type TrackStage = z.infer<typeof trackStageSchema>;
export type TrackResponse = z.infer<typeof trackResponseSchema>;
