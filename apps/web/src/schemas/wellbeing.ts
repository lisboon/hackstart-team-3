import { z } from "zod";

/**
 * Contrato de `GET /me/today` e `POST /me/today/mood`.
 *
 * A escala de 1 a 5, com 1 no pior, existe para a média agregada da unidade.
 * Ela não chega à tela: quem responde escolhe um emoji, não um número.
 */
export const moodScaleSchema = z.literal([1, 2, 3, 4, 5]);

export type MoodScale = z.infer<typeof moodScaleSchema>;

/**
 * As cinco etapas do método COOPS, do programa Cooperação na Ponta do Lápis do
 * próprio Sicredi. São a trilha: a pessoa caminha por elas na ordem.
 */
export const coopsStageSchema = z.enum([
  "CONSCIENTIZAR",
  "OBSERVAR",
  "ORGANIZAR",
  "PREPARAR",
  "SUSTENTAR",
]);

export type CoopsStage = z.infer<typeof coopsStageSchema>;

/**
 * A opção traz apenas o rótulo. A consequência de cada escolha fica no servidor
 * e só chega na resposta: se viesse junto, não seria decisão, seria gabarito.
 */
export const contentPieceSchema = z.object({
  id: z.uuid(),
  stage: coopsStageSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  prompt: z.string().min(1),
  options: z.array(z.object({ label: z.string().min(1) })).min(1),
  sourceUrl: z.url(),
});

export type ContentPiece = z.infer<typeof contentPieceSchema>;

/**
 * `answered` decide a tela: falso mostra só a pergunta, verdadeiro mostra o app.
 * `piece` vem `null` enquanto o humor não abrir o dia, e depois que a peça já
 * foi respondida — a diária termina, não se repete.
 */
export const dailyEntrySchema = z.object({
  entryDate: z.iso.datetime(),
  answered: z.boolean(),
  mood: moodScaleSchema.nullable(),
  pieceAnswered: z.boolean(),
  piece: contentPieceSchema.nullable(),
});

export type DailyEntry = z.infer<typeof dailyEntrySchema>;

/** O 201 de `POST /me/today/mood` confirma o dia sem repetir `answered`. */
export const moodRecordSchema = z.object({
  entryDate: z.iso.datetime(),
  mood: moodScaleSchema,
});

/**
 * O 201 de `POST /me/today/answer`. `outcome` vem sempre, qualquer que seja a
 * escolha: a pessoa aprende vendo o que a escolha dela faz. `comprehended`
 * registra a coerência com a peça e **não é erro quando falso**.
 */
export const pieceAnswerSchema = z.object({
  outcome: z.string().min(1),
  comprehended: z.boolean(),
  sourceUrl: z.url(),
});

export type PieceAnswer = z.infer<typeof pieceAnswerSchema>;
