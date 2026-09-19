import type { ContentPiece } from "@/schemas/wellbeing";
import { STAGE_LABEL } from "./coops-presentation";

/**
 * A IA traduz o conteúdo aprovado e cita a fonte — nada além dele entra no
 * prompt. Humor e situação declarada ficam fora de propósito: dado pessoal não
 * vai ao provider, e a aplicação ao caso dela já vem do servidor, no `prompt` e
 * no `outcome` da própria peça.
 */
export function buildExplanationPrompt(piece: ContentPiece): string {
  return [
    "Explique o conceito abaixo em no máximo três frases curtas, em português do Brasil, para um trabalhador da indústria.",
    "Use apenas o que está no conteúdo. Não dê conselho financeiro específico, não prometa resultado, não peça dados e não fale de sentimentos.",
    `Etapa do método COOPS: ${STAGE_LABEL[piece.stage]}.`,
    `Título: ${piece.title}`,
    `Conteúdo: ${piece.body}`,
    `Termine citando a fonte: ${piece.sourceUrl}`,
  ].join("\n");
}
