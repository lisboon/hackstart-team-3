"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/hooks/auth/use-auth";
import type { AuthUser } from "@/services/auth/auth-service";
import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Portão de sessão para as telas de recurso pessoal. O token vive na sessão do
 * navegador (ver `useAuth`): sem ele, a tela pede o acesso, igual à jornada.
 * Com ele, entrega token, o usuário da sessão e o `logout` para o filho, que
 * trata 401 devolvendo à tela de acesso.
 */
export function AuthGate({
  children,
}: {
  children: (props: {
    token: string;
    user: AuthUser | null;
    onUnauthorized: () => void;
  }) => ReactNode;
}) {
  const { token, user, error, pending, signIn, logout } = useAuth();
  if (!token)
    return (
      <Card className="p-6">
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
      {children({ token, user, onUnauthorized: logout })}
    </div>
  );
}
