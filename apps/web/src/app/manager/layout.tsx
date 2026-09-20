"use client";

import type { ReactNode } from "react";
import { ManagerDataProvider } from "@/components/manager/manager-data";
import { ManagerGate } from "@/components/manager/manager-gate";
import { ManagerHeader } from "@/components/manager/manager-header";
import { ManagerSidebar } from "@/components/manager/manager-sidebar";

/**
 * O gestor trabalha num desktop, então esta rota não entra na moldura de
 * celular: barra lateral à esquerda, cabeçalho em cima, conteúdo no resto.
 *
 * O portão fica aqui e não em cada página — rota nova de gestor nasce
 * protegida sem ninguém lembrar de protegê-la.
 */
export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <ManagerGate>
      <ManagerDataProvider>
        <div className="flex min-h-[100dvh] bg-background">
          <ManagerSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <ManagerHeader />
            <main className="px-4 pb-10 md:px-7">{children}</main>
          </div>
        </div>
      </ManagerDataProvider>
    </ManagerGate>
  );
}
