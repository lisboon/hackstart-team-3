"use client";

import type { ReactNode } from "react";
import { useCallback } from "react";
import { useAuth } from "@/hooks/auth/use-auth";
import { toast } from "@/lib/toast";
import type { AuthUser } from "@/services/auth/auth-service";
import { LoginScreen } from "@/components/auth/login-screen";
import { Button } from "@/components/ui/button";

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

  /**
   * O 401 chega aqui como `logout`. Sem o aviso a tela simplesmente volta
   * a pedir e-mail e senha, e quem estava no meio de responder o dia acha
   * que o aplicativo perdeu o que ela escreveu.
   */
  const onUnauthorized = useCallback(() => {
    logout();
    toast.warning("Sua sessão expirou", "Entre de novo para continuar.");
  }, [logout]);
  if (!token)
    return (
      <LoginScreen onSubmit={signIn} pending={pending} error={error} />
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
      {children({ token, user, onUnauthorized })}
    </div>
  );
}
