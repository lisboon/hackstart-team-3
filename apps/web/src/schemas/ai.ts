import { z } from "zod";

export const aiPromptSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, "Descreva o que você precisa.")
    .max(50000, "Use até 50.000 caracteres."),
});
export type AiPromptValues = z.infer<typeof aiPromptSchema>;
