"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/auth/use-auth";
import { LoginForm } from "./login-form";
import { PersonalSummary } from "@/components/financial-health/personal-summary";
import { MoodPrompt } from "@/components/wellbeing/mood-prompt";
import { SupportPaths } from "@/components/wellbeing/support-paths";
import {
  isSuffering,
  type MoodLevel,
} from "@/components/wellbeing/mood-presentation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function Workspace() {
  const { token, error, pending, signIn, logout } = useAuth();
  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [lessonSkipped, setLessonSkipped] = useState(false);

  /** Humor e escolha do dia vivem na memória da sessão, como o token. */
  function signOut() {
    setMood(null);
    setLessonSkipped(false);
    logout();
  }

  if (!token)
    return (
      <Card className="max-w-xl p-6">
        <LoginForm onSubmit={signIn} pending={pending} error={error} />
      </Card>
    );
  return (
    <div className="grid gap-4">
      <Button
        type="button"
        variant="secondary"
        className="justify-self-end"
        onClick={signOut}
      >
        Sair
      </Button>
      <MoodPrompt selected={mood} onSelect={setMood} />
      {mood && isSuffering(mood) && (
        <SupportPaths
          lessonSkipped={lessonSkipped}
          onSkipLesson={() => setLessonSkipped(true)}
          onResumeLesson={() => setLessonSkipped(false)}
        />
      )}
      {mood && <PersonalSummary token={token} onUnauthorized={signOut} />}
    </div>
  );
}
