"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { useProfile } from "@/hooks/profile/use-profile";
import type { AuthUser } from "@/services/auth/auth-service";
import {
  completedStages,
  trackRatio,
} from "@/components/profile/achievements-presentation";

/**
 * Perfil: ícone de pessoa dentro do anel de progresso da trilha, em escala
 * menor. Nome (da sessão), unidade e dois números reais — meses declarados e
 * etapas concluídas. Nenhum deles compara a pessoa com outra: é o caminho dela
 * contra ela mesma.
 */
export function ProfileView({
  token,
  user,
  onUnauthorized,
}: {
  token: string;
  user: AuthUser | null;
  onUnauthorized: () => void;
}) {
  const { data, error, loading, reload } = useProfile(token, onUnauthorized);

  return (
    <Card className="gap-6">
      <header className="grid gap-1">
        <p className="text-sm text-muted-foreground">Seu perfil</p>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          {user?.name ?? "Perfil"}
        </h1>
        {data && (
          <p className="text-sm text-muted-foreground">
            {data.organization.name}
          </p>
        )}
      </header>

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="text-sm text-muted-foreground"
      >
        {loading ? "Carregando o seu perfil…" : ""}
      </p>

      {error && !data && (
        <>
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto sm:justify-self-start"
            onClick={() => void reload()}
          >
            Tentar de novo
          </Button>
        </>
      )}

      {data && (
        <>
          <div className="grid justify-items-center gap-2">
            <ProgressRing
              ratio={trackRatio(data.track)}
              label={`Progresso da trilha: ${completedStages(data.track)} de ${
                data.track.stages.length
              } etapas concluídas`}
            >
              {/* Ícone de pessoa dentro do anel — a mesma forma da trilha. */}
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-10 w-10 text-primary"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </ProgressRing>
          </div>

          {/* Dois números reais e distintos. O contrato de /me/summary só expõe
              `declaredMonths`; não há contagem de dias separada, então a tela
              não inventa uma terceira medida que repetiria outra. */}
          <dl className="grid grid-cols-2 gap-3 text-center">
            <Stat label="Meses declarados" value={data.summary.declaredMonths} />
            <Stat label="Etapas concluídas" value={completedStages(data.track)} />
          </dl>
        </>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid gap-1 rounded-xl bg-muted p-3">
      <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
      <dt className="text-xs text-muted-foreground">{label}</dt>
    </div>
  );
}
