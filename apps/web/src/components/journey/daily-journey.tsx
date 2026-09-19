"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDailyMood } from "@/hooks/wellbeing/use-daily-mood";
import { MoodPrompt } from "@/components/wellbeing/mood-prompt";
import { SupportPaths } from "@/components/wellbeing/support-paths";
import { isSuffering } from "@/components/wellbeing/mood-presentation";
import { PersonalSummary } from "@/components/financial-health/personal-summary";

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
  const { today, error, loading, pending, record, reload } = useDailyMood(
    token,
    onUnauthorized,
  );
  const [lessonSkipped, setLessonSkipped] = useState(false);

  if (!today)
    return (
      <Card>
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          {loading ? "Carregando o seu dia…" : ""}
        </p>
        {!loading && (
          <>
            <p role="alert" className="text-sm text-destructive">
              {error || "Não foi possível carregar o seu dia."}
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
      </Card>
    );

  if (!today.answered)
    return <MoodPrompt pending={pending} error={error} onSelect={record} />;

  return (
    <>
      {today.mood !== null && isSuffering(today.mood) && (
        <SupportPaths
          lessonSkipped={lessonSkipped}
          onSkipLesson={() => setLessonSkipped(true)}
          onResumeLesson={() => setLessonSkipped(false)}
        />
      )}
      <PersonalSummary token={token} onUnauthorized={onUnauthorized} />
    </>
  );
}
