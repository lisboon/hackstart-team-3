import { CARE_DISCLAIMER } from "@/components/wellbeing/mood-presentation";

/** O piso de anonimização do produto. Abaixo disso o agregado não é publicado. */
const MINIMUM_GROUP = 5;

/**
 * O que a empresa vê, em palavras que a pessoa entende — porque um app que
 * coleta como ela está se sentindo e quanto sobrou no mês tem de responder
 * "quem lê isso?" antes de alguém precisar perguntar.
 *
 * Cada frase aqui corresponde a uma regra implementada no servidor, não a uma
 * promessa de marketing: o recorte por dono e empresa vale inclusive para
 * `ADMIN`, e agregado com menos de cinco pessoas volta indisponível em vez de
 * voltar o número.
 */
export function PrivacyNote() {
  return (
    <div className="grid gap-3 text-sm">
      <p>
        O seu gestor vê <strong>apenas números somados da unidade</strong>. Ele
        não vê como você respondeu, nem em que dia, nem o que você escreveu.
      </p>
      <p>
        Quando o recorte tem menos de {MINIMUM_GROUP} pessoas, o app{" "}
        <strong>não mostra número nenhum</strong>. Somar pouca gente não
        esconde ninguém.
      </p>
      <p>
        A sua declaração do mês pode ser corrigida por você a qualquer momento, e
        o histórico só é comparado com o seu próprio passado — nunca com o de
        outra pessoa, e nunca em forma de ranking.
      </p>
      <p className="text-muted-foreground">{CARE_DISCLAIMER}</p>
    </div>
  );
}
