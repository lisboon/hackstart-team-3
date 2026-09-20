"use client";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGate } from "@/components/auth/auth-gate";
import { GoalsWorkspace } from "@/components/savings-goal/goals-workspace";

export default function ProgressoPage() {
  return (
    <AuthGate>
      {({ token, onUnauthorized }) => (
        <AppShell>
          <div className="mx-auto grid w-full max-w-md gap-4 pb-24">
            <header className="px-1 pb-1 pt-2">
              <h1 className="font-serif text-[1.2rem] leading-tight">
                Progresso
              </h1>
            </header>
            <GoalsWorkspace token={token} onUnauthorized={onUnauthorized} />
          </div>
        </AppShell>
      )}
    </AuthGate>
  );
}
