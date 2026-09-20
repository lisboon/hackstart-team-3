"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Home, Route, Trophy, User } from "lucide-react";
import { useAuth } from "@/hooks/auth/use-auth";
import { ICON_STROKE } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const DESTINATIONS = [
  { href: "/", label: "Hoje", Icon: Home },
  { href: "/progresso", label: "Progresso", Icon: Activity },
  { href: "/trilha", label: "Trilha", Icon: Route, center: true },
  { href: "/conquistas", label: "Conquistas", Icon: Trophy },
  { href: "/perfil", label: "Perfil", Icon: User },
] as const;

/**
 * A navegação só existe depois de entrar: antes disso a tela tem uma tarefa
 * só, e uma barra de cinco destinos atrapalharia. Por isso o componente lê a
 * sessão em vez de receber por prop — cada rota ganha a barra sem repasse.
 */
export function TabBar() {
  const { token, isInitialized } = useAuth();
  const pathname = usePathname();

  if (!isInitialized || !token) return null;

  return (
    <nav
      aria-label="Navegação principal"
      className="grid grid-cols-5 items-center border-t border-border bg-background/70 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"
    >
      {DESTINATIONS.map(({ href, label, Icon, ...tab }) => {
        const current = pathname === href;
        const center = "center" in tab;
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg text-[0.625rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              current ? "text-primary" : "text-muted-foreground",
            )}
          >
            {center ? (
              /* Elevado, preenchido e com uma flutuação de cinco pixels: é a
                 ação que o produto quer que aconteça, e a única coisa do app
                 que se move sozinha. */
              <span className="animate-tab-float -mt-7 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground">
                <Icon aria-hidden className="size-6" strokeWidth={ICON_STROKE} />
              </span>
            ) : (
              <Icon aria-hidden className="size-5" strokeWidth={ICON_STROKE} />
            )}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
