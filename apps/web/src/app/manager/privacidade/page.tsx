import { Card } from "@/components/ui/card";

const HIDDEN = [
  "O humor de qualquer pessoa, em qualquer dia",
  "A declaração mensal de qualquer pessoa",
  "Quem respondeu a peça do dia e o que respondeu",
  "Quem abriu um canal de apoio, e qual",
  "Qualquer lista com nome, e-mail ou identificador",
];

const SHOWN = [
  ["Aperto financeiro", "Fração de quem declarou o mês, nunca quem"],
  ["Humor agregado", "Média da unidade no período"],
  ["Alcance e adesão", "Contagens de pessoas, não identidades"],
  ["Frequência", "Dias com registro por pessoa que manteve o diário"],
  ["Canais de apoio", "Quantas aberturas, sem saber de quem"],
];

/**
 * O que o gestor não vê é parte do produto, e mostrar isso dentro dele
 * responde a pergunta que a banca fez sobre uso dos dados melhor que
 * qualquer slide.
 */
export default function ManagerPrivacyPage() {
  return (
    <div className="grid max-w-3xl gap-6">
      <header className="grid gap-2">
        <h2 className="text-2xl font-semibold">O que este painel não mostra</h2>
        <p className="text-muted-foreground">
          A regra não é de tela: o servidor decide o que pode sair e recusa
          entregar o resto. Abrir o inspetor do navegador não revela mais nada.
        </p>
      </header>

      <Card className="gap-3">
        <h3 className="font-semibold text-destructive">Nunca sai daqui</h3>
        <ul className="grid gap-2 text-sm text-muted-foreground">
          {HIDDEN.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="text-destructive">
                ✕
              </span>
              {item}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="gap-3">
        <h3 className="font-semibold">O que você vê, e o que significa</h3>
        <dl className="grid gap-3 text-sm">
          {SHOWN.map(([term, meaning]) => (
            <div key={term} className="grid gap-0.5">
              <dt className="font-medium">{term}</dt>
              <dd className="text-muted-foreground">{meaning}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="gap-3">
        <h3 className="font-semibold">Supressão em dois níveis</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Abaixo de cinco pessoas com registro no mês, a unidade inteira some —
          nem o tamanho do grupo aparece. Além disso,{" "}
          <strong className="text-foreground">
            cada indicador é suprimido pela própria população
          </strong>
          : dez pessoas ativas das quais só três declararam produzem uma
          estatística de três pessoas, e publicá-la porque as outras sete
          registraram humor seria o mesmo vazamento entrando pela porta de trás.
        </p>
      </Card>

      <Card className="gap-3">
        <h3 className="font-semibold">A ação é de unidade</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          O que estes números sugerem é levar um assessor, marcar palestra ou
          revisar a jornada da equipe.{" "}
          <strong className="text-foreground">
            Nunca convocar uma pessoa com base no uso do aplicativo.
          </strong>{" "}
          Quem faz isso quebra a promessa que fez o trabalhador responder com
          honestidade — e o dado seguinte já vem mentiroso.
        </p>
      </Card>
    </div>
  );
}
