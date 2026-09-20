"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/auth/use-auth";
import { DESTINATIONS } from "@/components/layout/destinations";
import { ProfileCard } from "@/components/manager/profile-card";

/**
 * Cabeçalho de desktop, no mesmo arranjo do painel: título à esquerda, conta à
 * direita. No celular ele some — lá o título é o da própria tela.
 */
export function AppHeader() {
  const { token, isInitialized } = useAuth();
  const pathname = usePathname();

  if (!isInitialized || !token) return null;

  const title =
    DESTINATIONS.find((item) => item.href === pathname)?.label ?? "Colheita";

  return (
    <header className="z-40 hidden h-20 items-center justify-between px-8 pt-6 md:flex">
      <h1 className="truncate text-lg font-semibold">{title}</h1>
      <ProfileCard />
    </header>
  );
}
