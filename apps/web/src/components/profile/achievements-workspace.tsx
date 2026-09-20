"use client";

import { AuthGate } from "@/components/auth/auth-gate";
import { AchievementsView } from "@/components/profile/achievements-view";

/**
 * Client wrapper: mantém o render-prop do `AuthGate` dentro de um client
 * component, para a página (server) só passar um elemento — uma função não pode
 * cruzar a fronteira Server→Client.
 */
export function AchievementsWorkspace() {
  return (
    <AuthGate>
      {({ token, onUnauthorized }) => (
        <AchievementsView token={token} onUnauthorized={onUnauthorized} />
      )}
    </AuthGate>
  );
}
