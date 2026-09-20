import type { Account } from "@/schemas/account";
import type { PersonalSummary } from "@/schemas/financial-health";
import type { Track } from "@/schemas/track";
import type { CoopsStage } from "@/schemas/wellbeing";
import { formatMonth } from "@/components/financial-health/summary-presentation";
import { STAGE_LABEL } from "@/components/journey/coops-presentation";
import {
  completedStages,
  isStageComplete,
} from "@/components/profile/achievements-presentation";

/**
 * Preposição não é inicial. "Ana Paula de Souza" abreviada como "AD" não é o
 * nome de ninguém, e nome com preposição é a regra e não a exceção no Brasil.
 */
const CONNECTIVES = new Set(["de", "da", "do", "das", "dos", "e"]);

/**
 * Duas letras no máximo: primeira e última palavra que importam. Nome de uma só
 * palavra devolve uma letra em vez de repeti-la, porque "AA" para "Ana" parece
 * defeito.
 */
export function initials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part && !CONNECTIVES.has(part.toLocaleLowerCase("pt-BR")));
  if (parts.length === 0) return "?";
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toLocaleUpperCase("pt-BR");
}

/**
 * Desde quando a pessoa está aqui, no mês e no ano. Reaproveita o formatador do
 * resumo, que já resolve o detalhe de formatar em UTC: `createdAt` vem em UTC, e
 * formatar no fuso local joga o dia 1 para o mês anterior em qualquer offset
 * negativo — o do Brasil inteiro.
 */
export function formatMemberSince(createdAt: string): string {
  return formatMonth(createdAt);
}

/**
 * A etapa em aberto do COOPS: a primeira que ainda não fechou. `null` quando a
 * trilha inteira está concluída, e também quando não há etapa alguma — trilha
 * vazia não tem etapa atual, e afirmar "Conscientizar" ali seria inventar.
 */
export function currentStage(track: Track): CoopsStage | null {
  return track.stages.find((stage) => !isStageComplete(stage))?.stage ?? null;
}

/**
 * `number` desenha grande e em `tabular-nums`; `text` desenha menor, porque
 * "Conscientizar" e "Setembro de 2026" no mesmo corpo de um "4" estouram a
 * largura de uma coluna a 390px.
 */
export type ProfileStat = {
  id: string;
  label: string;
  value: string;
  emphasis: "number" | "text";
};

/**
 * Os quatro números do perfil, todos derivados de dado que já existe. Nenhum é
 * moeda, nenhum é trocável e nenhum compara a pessoa com outra: o cliente
 * recusou premiação, e ranking entre colegas inverteria o produto.
 *
 * Não há um quinto: contagem de dias, sequência e "energia" não existem em
 * contrato nenhum, e inventá-las seria mostrar à pessoa um número que o servidor
 * não sustenta.
 */
export function profileStats({
  account,
  summary,
  track,
}: {
  account: Account;
  summary: Pick<PersonalSummary, "declaredMonths">;
  track: Track;
}): ProfileStat[] {
  const stage = currentStage(track);
  return [
    {
      id: "declared-months",
      label: "Meses declarados",
      value: String(Math.max(summary.declaredMonths, 0)),
      emphasis: "number",
    },
    {
      id: "completed-stages",
      label: "Etapas concluídas",
      value: `${completedStages(track)} de ${track.stages.length}`,
      emphasis: "number",
    },
    {
      id: "current-stage",
      label: "Etapa atual",
      // Trilha sem etapa alguma não está concluída: está vazia. Dizer
      // "concluída" ali seria dar à pessoa um crédito que ela não recebeu.
      value:
        track.stages.length === 0
          ? "Ainda sem trilha"
          : stage
            ? STAGE_LABEL[stage]
            : "Trilha concluída",
      emphasis: "text",
    },
    {
      id: "member-since",
      label: "Membro desde",
      value: formatMemberSince(account.createdAt),
      emphasis: "text",
    },
  ];
}
