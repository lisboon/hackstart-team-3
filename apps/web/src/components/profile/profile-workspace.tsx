"use client";

import { AuthGate } from "@/components/auth/auth-gate";
import { ProfileView } from "@/components/profile/profile-view";

/**
 * Client wrapper: o portão de sessão usa render-prop (uma função como filho), e
 * uma função não pode cruzar a fronteira Server→Client. Mantendo o `AuthGate`
 * dentro deste client component, a página (server) só renderiza um elemento.
 */
export function ProfileWorkspace() {
  return (
    <AuthGate>
      {({ token, user, onUnauthorized }) => (
        <ProfileView
          token={token}
          user={user}
          onUnauthorized={onUnauthorized}
        />
      )}
    </AuthGate>
  );
}
