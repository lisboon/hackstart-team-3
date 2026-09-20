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
const journeyWindowSchema = z.object({
  open: z.boolean(),
  /** A abertura vigente, se aberta; a próxima, se fechada. */
  opensAt: z.iso.datetime(),
  closesAt: z.iso.datetime(),
});

export const dailyEntrySchema = z.object({
  entryDate: z.iso.datetime(),
  answered: z.boolean(),
  mood: moodScaleSchema.nullable(),
  /**
   * A nota pessoal do humor de hoje, quando a pessoa escolheu especificar o que
   * está sentindo. É dado só dela: o servidor nunca manda isto ao gestor.
   */
  note: z.string().nullable(),
  pieceAnswered: z.boolean(),
  piece: contentPieceSchema.nullable(),
  /**
   * O horário de escrita da unidade. A tela lê daqui em vez de descobrir pelo
   * 403: oferecer uma pergunta que o servidor vai recusar é pior que não
   * oferecer.
   */
  window: journeyWindowSchema,
});

export type DailyEntry = z.infer<typeof dailyEntrySchema>;

/**
 * Tamanho máximo da nota opcional do humor, espelhando o limite do backend
 * (`MAX_MOOD_NOTE_LENGTH`). A tela usa para não deixar digitar além do que o
 * servidor aceitaria.
 */
export const MAX_MOOD_NOTE_LENGTH = 500;

/** O 201 de `POST /me/today/mood` confirma o dia sem repetir `answered`. */
export const moodRecordSchema = z.object({
  entryDate: z.iso.datetime(),
  mood: moodScaleSchema,
  /** A nota que a pessoa acabou de registrar, `null` quando não especificou. */
  note: z.string().nullable(),
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

/**
 * Contrato de `GET /me/journey`. A trilha inteira vira nós, um por peça, na
 * ordem do COOPS. O estado de cada nó decide o que a tela mostra e o que ela
 * deixa fazer:
 *
 * - `answered`: já respondida. Volta em leitura, com o rótulo escolhido e a
 *   consequência daquela escolha. Não traz `options` — a decisão não se refaz.
 * - `current`: a próxima a responder, a única com `options` (só rótulos) e sem
 *   consequência à vista.
 * - `locked`: ainda trancada. Só o rótulo do nó, nada do corpo.
 *
 * Os campos vêm anuláveis porque a presença deles depende do estado. Um mapa
 * que revelasse o corpo de uma peça trancada, ou a consequência da atual antes
 * da escolha, entregaria gabarito.
 */
export const journeyNodeStateSchema = z.enum([
  "answered",
  "current",
  "locked",
]);

export type JourneyNodeState = z.infer<typeof journeyNodeStateSchema>;

export const journeyNodeSchema = z.object({
  id: z.uuid(),
  stage: coopsStageSchema,
  orderInStage: z.number().int(),
  title: z.string().min(1),
  state: journeyNodeStateSchema,
  body: z.string().nullable(),
  prompt: z.string().nullable(),
  options: z.array(z.object({ label: z.string().min(1) })).nullable(),
  answer: z.string().nullable(),
  outcome: z.string().nullable(),
  sourceUrl: z.url(),
});

export type JourneyNode = z.infer<typeof journeyNodeSchema>;

export const journeySchema = z.object({
  nodes: z.array(journeyNodeSchema),
});

export type Journey = z.infer<typeof journeySchema>;
