import Link from "next/link";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ICON_STROKE } from "@/components/ui/icon";

/**
 * Fora do expediente a diária não vira mensagem de erro. Erro é quando algo deu
 * errado; isto é o produto funcionando como projetado.
 *
 * A janela existe porque o art. 4º da CLT conta como serviço efetivo o tempo em
 * que a pessoa está à disposição do empregador — pedir cinco minutos à noite
 * seria pedir trabalho não pago. Quem lê esta tela não precisa saber disso, mas
 * precisa saber quando volta, e que o resto do app continua aberto.
 */
export function WindowClosed({ opensAt }: { opensAt: string }) {
  return (
    <Card className="gap-3">
      <div className="flex items-center gap-2 text-primary">
        <Clock aria-hidden className="size-5" strokeWidth={ICON_STROKE} />
        <h1 className="text-lg font-semibold text-foreground">
          Sua próxima diária abre {whenIn(opensAt)}
        </h1>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        A jornada acontece dentro do expediente, porque ela é parte do seu
        trabalho — não do seu descanso.
      </p>
      <p className="text-sm text-muted-foreground">
        Enquanto isso, você pode{" "}
        <Link
          href="/trilha"
          className="rounded font-medium text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          rever a sua trilha
        </Link>
        .
      </p>
    </Card>
  );
}

const WEEKDAY = new Intl.DateTimeFormat("pt-BR", { weekday: "long" });
const CLOCK = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * "amanhã, às 07:30" ou "segunda-feira, às 07:30". O servidor manda o instante
 * em UTC e quem formata é o aparelho — assim a hora mostrada é a do relógio de
 * quem lê, e não a de quem escreveu o código.
 */
function whenIn(opensAt: string) {
  const date = new Date(opensAt);
  const hour = CLOCK.format(date);
  const days = daysAhead(date);

  if (days === 0) return `hoje, às ${hour}`;
  if (days === 1) return `amanhã, às ${hour}`;
  return `${WEEKDAY.format(date)}, às ${hour}`;
}

function daysAhead(date: Date) {
  const midnight = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  return Math.round((midnight(date) - midnight(new Date())) / 86_400_000);
}
