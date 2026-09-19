import { z } from "zod";

/**
 * Contrato de `GET /me/today` e `POST /me/today/mood`.
 *
 * A escala de 1 a 5, com 1 no pior, existe para a média agregada da unidade.
 * Ela não chega à tela: quem responde escolhe um emoji, não um número.
 */
export const moodScaleSchema = z.literal([1, 2, 3, 4, 5]);

export type MoodScale = z.infer<typeof moodScaleSchema>;

/** `answered` decide a tela: falso mostra só a pergunta, verdadeiro mostra o app. */
export const dailyEntrySchema = z.object({
  entryDate: z.iso.datetime(),
  answered: z.boolean(),
  mood: moodScaleSchema.nullable(),
});

export type DailyEntry = z.infer<typeof dailyEntrySchema>;

/** O 201 de `POST /me/today/mood` confirma o dia sem repetir `answered`. */
export const moodRecordSchema = z.object({
  entryDate: z.iso.datetime(),
  mood: moodScaleSchema,
});
