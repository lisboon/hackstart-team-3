import type { PersonalSummary } from "@/schemas/financial-health";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  averageRatio,
  compareTrajectory,
  describeAverage,
  TRAJECTORY_MESSAGE,
} from "./summary-presentation";

function Period({ title, average }: { title: string; average: number }) {
  return (
    <li className="grid gap-2">
      <p className="text-sm">
        <span className="text-muted-foreground">{title}: </span>
        <span className="font-semibold">{describeAverage(average)}</span>
      </p>
      {/* Decorativa de propósito: a frase acima já diz como os meses fecharam,
          em palavras. A barra anunciada repetiria a informação e, pior, teria de
          dizer um número — e a escala existe só para a média da própria pessoa,
          nunca para a tela. */}
      <ProgressBar ratio={averageRatio(average)} decorative />
    </li>
  );
}

/**
 * Trajetória da pessoa contra o próprio passado. Sem média recente não há
 * gráfico, e sem média anterior não há comparação nem tendência: `null` é
 * ausência de declaração, não o pior resultado.
 */
export function TrajectoryPanel({ summary }: { summary: PersonalSummary }) {
  const { recentAverage, previousAverage } = summary;
  if (recentAverage === null)
    return (
      <p className="text-sm text-muted-foreground">
        Sua trajetória aparece aqui a partir da primeira declaração. A comparação
        é sempre com o seu próprio histórico, nunca com outras pessoas.
      </p>
    );
  const trajectory = compareTrajectory(summary);
  return (
    <div className="grid gap-4">
      <h3 className="text-sm font-semibold">Sua trajetória</h3>
      <ul className="grid gap-4">
        <Period title="Últimos três meses" average={recentAverage} />
        {previousAverage !== null && (
          <Period title="Três meses anteriores" average={previousAverage} />
        )}
      </ul>
      <p className="text-sm text-muted-foreground">
        {trajectory
          ? TRAJECTORY_MESSAGE[trajectory]
          : "Quando houver mais um trimestre declarado, a comparação com o seu próprio passado aparece aqui."}
      </p>
    </div>
  );
}
