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
 * `GET /me/today` diz se o humor do dia já foi registrado. A pergunta de humor
 * fica integrada no topo da Home: interativa até responder, e depois marcada e
 * desabilitada (uma resposta por dia, sem correção). Abaixo dela vêm a ofensiva
 * da semana e o resumo pessoal, quando o dia está aberto.
 *
 * A peça do COOPS não vive aqui: ela é a trilha (`/trilha`), aberta ao tocar na
 * colheita.
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

  return (
    <>
      <h1 className="sr-only">Seu dia</h1>
      {/* No topo, sempre: sem humor, a pergunta interativa; com humor, a
          exibição do tempo que a pessoa escolheu (MoodBadge). */}
      {today.answered && today.mood !== null ? (
        <MoodBadge mood={today.mood} />
      ) : (
        <MoodPrompt pending={pending} error={error} onConfirm={answer} />
      )}
      {/* O acolhimento só quando a pessoa declarou sofrimento (humor 1–2):
          sem humor não há o que acolher. */}
      {today.answered && today.mood !== null && isSuffering(today.mood) && (
        <SupportPaths takeFocus={answeredNow} />
      )}
      {/* Ofensiva e resumo não dependem do humor de hoje: aparecem sempre. */}
      {streak && <WeeklyHarvestCard streak={streak} />}
      <PersonalSummary
        token={token}
        onUnauthorized={onUnauthorized}
        className="rounded-none"
      />
    </>
  );
}
