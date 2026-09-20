"use client";

import type { ReactNode } from "react";
import { ManagerDataProvider } from "@/components/manager/manager-data";
import { ManagerGate } from "@/components/manager/manager-gate";
import { ManagerHeader } from "@/components/manager/manager-header";
import { ManagerSidebar } from "@/components/manager/manager-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * O gestor trabalha num desktop, então esta rota não entra na moldura de
 * celular: sidebar à esquerda, cabeçalho em cima, conteúdo no resto.
 *
 * O portão fica aqui e não em cada página — rota nova de gestor nasce
 * protegida sem ninguém lembrar de protegê-la.
 */
export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <ManagerGate>
      <ManagerDataProvider>
        <SidebarProvider>
          <ManagerSidebar />
          <SidebarInset>
            <ManagerHeader />
            <main className="px-2 pb-10 md:px-7">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </ManagerDataProvider>
    </ManagerGate>
  );
}
