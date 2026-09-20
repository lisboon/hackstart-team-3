import { z } from "zod";

/**
 * Contrato de `GET /me/progress`. Dia sem registro não vem em `days`: a tela o
 * desenha vazio, sem alerta e sem cobrança. Ausência de dado, nunca falha.
 */
export const progressSchema = z.object({
  month: z.iso.datetime(),
  daysInMonth: z.number().int().min(28).max(31),
  days: z.array(z.number().int().min(1).max(31)),
  total: z.number().int().min(0),
});

export type Progress = z.infer<typeof progressSchema>;
