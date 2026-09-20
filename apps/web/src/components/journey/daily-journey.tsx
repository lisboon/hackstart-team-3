"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDailyMood } from "@/hooks/wellbeing/use-daily-mood";
import { MoodPrompt } from "@/components/wellbeing/mood-prompt";
import { MoodBadge } from "@/components/wellbeing/mood-badge";
import { SupportPaths } from "@/components/wellbeing/support-paths";
import { isSuffering } from "@/components/wellbeing/mood-presentation";
import { WeeklyHarvestCard } from "@/components/streak/weekly-harvest-card";
import { useStreak } from "@/hooks/streak/use-streak";
import { WindowClosed } from "@/components/journey/window-closed";
import { PersonalSummary } from "@/components/financial-health/personal-summary";
import { useState } from "react";
import type { MoodScale } from "@/schemas/wellbeing";

/**
 * `GET /me/today` decide a tela: dia sem humor mostra só a pergunta; dia com
 * humor mostra o app. A pergunta de abertura é uma resposta por dia, sem
 * correção.
 *
 * A peça do COOPS não vive aqui: ela é a trilha (`/trilha`), aberta ao tocar na
 * colheita. A Home é o dia — humor, a ofensiva da semana e o resumo pessoal.
 */
export function DailyJourney({
  token,
  onUnauthorized,
}: {
  token: string;
  onUnauthorized: () => void;
}) {
  const { today, error, loading, pending, record, reload } = useDailyMood(
    token,
    onUnauthorized,
  );
  const [answeredNow, setAnsweredNow] = useState(false);
  const { streak } = useStreak(token, onUnauthorized);

  async function answer(mood: MoodScale, note?: string) {
    if (await record(mood, note)) setAnsweredNow(true);
  }

  if (!today && loading)
    return (
      <Card>
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          Carregando o seu dia…
        </p>
      </Card>
    );

  if (!today)
    return error ? (
      <Card>
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
      </Card>
    ) : null;

  // Fora do expediente a pergunta some, mas o resto da tela fica: o rodapé com
  // o CVV, a barra de abas e a trilha continuam onde estavam. Fecha a escrita,
  // não a porta.
  if (!today.window.open)
    return <WindowClosed opensAt={today.window.opensAt} />;

  if (!today.answered)
    return <MoodPrompt pending={pending} error={error} onConfirm={answer} />;

  return (
    <>
      {/* Depois da resposta a pergunta sai da tela e levaria o h1 com ela. */}
      <h1 className="sr-only">Seu dia</h1>
      {/* O humor fica fixo no topo, agora como registro do dia (só leitura). */}
      {today.mood !== null && <MoodBadge mood={today.mood} />}
      {today.mood !== null && isSuffering(today.mood) && (
        <SupportPaths takeFocus={answeredNow} />
      )}
      {streak && <WeeklyHarvestCard streak={streak} />}
      <PersonalSummary
        token={token}
        onUnauthorized={onUnauthorized}
        className="rounded-none"
      />
    </>
  );
}
