"use client";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGate } from "@/components/auth/auth-gate";
import { GoalsWorkspace } from "@/components/savings-goal/goals-workspace";
import { MonthProgress } from "@/components/progress/month-progress";

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
            <MonthProgress token={token} onUnauthorized={onUnauthorized} />
            <GoalsWorkspace token={token} onUnauthorized={onUnauthorized} />
          </div>
        </AppShell>
      )}
    </AuthGate>
  );
}
