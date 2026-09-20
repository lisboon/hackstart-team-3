"use client";

import { AuthGate } from "@/components/auth/auth-gate";
import { SettingsView } from "@/components/settings/settings-view";

/**
 * Client wrapper: o portão de sessão usa render-prop, e uma função não pode
 * cruzar a fronteira Server→Client. Mantendo o `AuthGate` aqui, a página
 * (server) só renderiza um elemento.
 */
export function SettingsWorkspace() {
  return <AuthGate>{({ token }) => <SettingsView token={token} />}</AuthGate>;
}
