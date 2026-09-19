"use client";

import { AuthGate } from "@/components/auth/auth-gate";
import { DailyJourney } from "@/components/journey/daily-journey";

export function Workspace() {
  return (
    <AuthGate>
      {({ token, onUnauthorized }) => (
        <DailyJourney token={token} onUnauthorized={onUnauthorized} />
      )}
    </AuthGate>
  );
}
