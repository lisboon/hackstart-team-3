"use client";

import { useAuth } from "@/hooks/auth/use-auth";
import { ManagerDashboard } from "@/components/manager/manager-dashboard";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ManagerPage() {
  const { token, user, isInitialized, logout } = useAuth();
  const router = useRouter();

  if (!isInitialized) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Carregando sessão...</div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
        <p className="text-muted-foreground mb-6">Você precisa estar logado para acessar esta página.</p>
        <Button onClick={() => router.push("/")}>Fazer Login</Button>
      </main>
    );
  }

  // Issue 14: um USER que acessar a rota recebe 403.
  if (user?.role === "USER") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <h1 className="text-3xl font-bold text-destructive mb-4">403 Proibido</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          Sua conta não tem permissão de gestor para acessar o painel da unidade.
        </p>
        <Button onClick={() => router.push("/")}>Voltar ao Início</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-8 py-12">
      <div className="flex justify-between items-center mb-10">
        <div className="font-bold text-primary">Colheita Verde</div>
        <Button
          variant="secondary"
          onClick={() => {
            logout();
            router.push("/");
          }}
        >
          Sair
        </Button>
      </div>
      <ManagerDashboard />
    </main>
  );
}
