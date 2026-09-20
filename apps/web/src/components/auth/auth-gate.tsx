"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/hooks/auth/use-auth";
import type { AuthUser } from "@/services/auth/auth-service";
import { LoginScreen } from "@/components/auth/login-screen";

/**
 * Portão de sessão para as telas de recurso pessoal. O token vive na sessão do
 * navegador (ver `useAuth`): sem ele, a tela pede o acesso, igual à jornada.
 * Com ele, entrega token, o usuário da sessão e o `logout` para o filho, que
 * trata 401 devolvendo à tela de acesso.
 *
 * O portão não desenha "Sair". Ele desenhava, no canto de toda tela logada, e
 * era o botão mais fácil de acertar por acidente num app que a pessoa abre em
 * cinco minutos de intervalo. Sair agora mora no fim de Perfil → Configurações,
 * com confirmação. `onUnauthorized` continua sendo o `logout`: 401 devolve à
 * tela de acesso sem pedir nada a ninguém.
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
    return <LoginScreen onSubmit={signIn} pending={pending} error={error} />;
  return <>{children({ token, user, onUnauthorized: logout })}</>;
}
