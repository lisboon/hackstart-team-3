"use client";

import { useAuth } from "@/hooks/auth/use-auth";
import { LoginForm } from "./login-form";
import { AiPanel } from "@/components/ai/ai-panel";
import { PersonalSummary } from "@/components/financial-health/personal-summary";
import { Button } from "@/components/ui/button";

export function Workspace() {
  const { token, error, pending, signIn, logout } = useAuth();
  if (!token)
    return (
      <section className="max-w-xl rounded-2xl border border-border bg-card p-6">
        <LoginForm onSubmit={signIn} pending={pending} error={error} />
      </section>
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
      <PersonalSummary token={token} onUnauthorized={logout} />
      <AiPanel token={token} onUnauthorized={logout} />
    </div>
  );
}
