"use client";

import { useAuth } from "@/hooks/auth/use-auth";
import { LoginForm } from "./login-form";
import { DailyJourney } from "@/components/journey/daily-journey";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function Workspace() {
  const { token, error, pending, signIn, logout } = useAuth();
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
        onClick={logout}
      >
        Sair
      </Button>
      <DailyJourney token={token} onUnauthorized={logout} />
    </div>
  );
}
