"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/auth/use-auth";
import { Button } from "@/components/ui/button";

/**
 * Portão do painel. O guarda de verdade é o `RolesGuard` do backend, que
 * devolve 403 no endpoint — isto aqui poupa a pessoa de ver uma tela vazia,
 * não protege o dado.
 *
 * `!== "ADMIN"` e não `=== "USER"`: barrar um valor deixaria `EDITOR` e
 * `VIEWER` entrarem.
 */
export function ManagerGate({ children }: { children: ReactNode }) {
  const { token, user, isInitialized } = useAuth();
  const router = useRouter();

  if (!isInitialized)
    return (
      <Centered>
        <p className="animate-pulse text-muted-foreground" role="status">
          Carregando sessão…
        </p>
      </Centered>
    );

  if (!token)
    return (
      <Centered>
        <h1 className="mb-3 text-2xl font-semibold">Acesso restrito</h1>
        <p className="mb-6 text-muted-foreground">
          Entre para ver o painel da unidade.
        </p>
        <Button onClick={() => router.push("/")}>Entrar</Button>
      </Centered>
    );

  if (user?.role !== "ADMIN")
    return (
      <Centered>
        <h1 className="mb-3 text-2xl font-semibold text-destructive">
          403 — sem permissão
        </h1>
        <p className="mb-6 max-w-md text-muted-foreground">
          Sua conta não tem permissão de gestor. O painel mostra apenas números
          de unidade, nunca dados de uma pessoa.
        </p>
        <Button onClick={() => router.push("/")}>Voltar ao início</Button>
      </Centered>
    );

  return <>{children}</>;
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-8 text-center">
      {children}
    </main>
  );
}
