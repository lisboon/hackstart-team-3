import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

/**
 * Cartão de identidade: quem a pessoa é, onde ela está e desde quando. Bloco
 * puro — recebe texto pronto e não conhece hook nem serviço, para que a tela
 * decida o que carregar e este pedaço só desenhe.
 *
 * O progresso da trilha entra aqui, e não numa tela à parte, porque a pergunta
 * "onde eu estou no caminho" pertence à identidade da pessoa neste produto. A
 * barra vem com rótulo em texto: progresso não pode ser indicado só por
 * comprimento e cor (WCAG 1.4.1).
 */
export function ProfileHeader({
  name,
  initials,
  avatarUrl,
  organizationName,
  memberSince,
  trackRatio,
  completedStages,
  totalStages,
}: {
  name: string;
  initials: string;
  avatarUrl?: string;
  organizationName: string;
  memberSince: string;
  trackRatio: number;
  completedStages: number;
  totalStages: number;
}) {
  return (
    <Card className="gap-5">
      <div className="flex items-center gap-4">
        <Avatar initials={initials} src={avatarUrl} />
        <div className="grid min-w-0 gap-1">
          <h2 className="truncate text-lg font-semibold tracking-tight">
            {name}
          </h2>
          <p className="truncate text-sm text-muted-foreground">
            {organizationName}
          </p>
          <Badge>Membro desde {memberSince}</Badge>
        </div>
      </div>
      <div className="grid gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium">Trilha COOPS</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {completedStages} de {totalStages} etapas
          </p>
        </div>
        {/* O texto acima já diz quantas etapas fecharam, então a barra é
            ornamento e não repete a informação para quem usa leitor de tela. */}
        <ProgressBar ratio={trackRatio} decorative />
      </div>
    </Card>
  );
}
