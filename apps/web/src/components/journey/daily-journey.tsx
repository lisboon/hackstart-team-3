"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDailyMood } from "@/hooks/wellbeing/use-daily-mood";
import { MoodPrompt } from "@/components/wellbeing/mood-prompt";
import { SupportPaths } from "@/components/wellbeing/support-paths";
import { isSuffering } from "@/components/wellbeing/mood-presentation";
import { DailyCard } from "@/components/journey/daily-card";
import { PersonalSummary } from "@/components/financial-health/personal-summary";
import type { MoodScale } from "@/schemas/wellbeing";

/**
 * `GET /me/today` decide a tela: dia sem resposta mostra só a pergunta; dia
 * respondido mostra o app. Como é uma resposta por dia, sem correção, a
 * pergunta deixa de existir depois de respondida.
 */
export function DailyJourney({
  token,
  onUnauthorized,
}: {
  token: string;
  onUnauthorized: () => void;
}) {
  const {
    today,
    answer: pieceAnswer,
    error,
    loading,
    pending,
    record,
    decide,
    reload,
  } = useDailyMood(token, onUnauthorized);
  const [lessonSkipped, setLessonSkipped] = useState(false);
  const [answeredNow, setAnsweredNow] = useState(false);

  async function answer(mood: MoodScale) {
    if (await record(mood)) setAnsweredNow(true);
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

  if (!today.answered)
    return <MoodPrompt pending={pending} error={error} onSelect={answer} />;

  return (
    <>
      {/* Depois da resposta a pergunta sai da tela e levaria o h1 com ela. */}
      <h1 className="sr-only">Seu dia</h1>
      {today.mood !== null && isSuffering(today.mood) && (
        <SupportPaths
          lessonSkipped={lessonSkipped}
          takeFocus={answeredNow}
          onSkipLesson={() => setLessonSkipped(true)}
          onResumeLesson={() => setLessonSkipped(false)}
        />
      )}
      {!lessonSkipped && today.piece && (
        <DailyCard
          piece={today.piece}
          answer={pieceAnswer}
          pending={pending}
          onDecide={(label) => void decide(today.piece!.id, label)}
        />
      )}
      <PersonalSummary token={token} onUnauthorized={onUnauthorized} />
    </>
  );
}
