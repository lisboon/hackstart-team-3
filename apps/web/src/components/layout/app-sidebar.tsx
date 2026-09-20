"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/auth/use-auth";
import { ColheitaMark } from "@/components/brand/colheita-mark";
import { DESTINATIONS } from "@/components/layout/destinations";
import { ICON_STROKE } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * A forma de desktop da navegação. Some no celular, onde quem manda é a barra
 * de abas — as duas leem a mesma lista de destinos.
 */
export function AppSidebar() {
  const { token, isInitialized } = useAuth();
  const pathname = usePathname();

  if (!isInitialized || !token) return null;

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-3 md:flex">
      <div className="flex items-center gap-2 px-2 py-3">
        <ColheitaMark className="size-6 text-brand" />
        <span className="text-base font-semibold">Colheita</span>
      </div>

      <nav aria-label="Navegação principal" className="mt-2 grid gap-1">
        {DESTINATIONS.map(({ href, label, Icon }) => {
          const current = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
                current
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <Icon aria-hidden className="size-5" strokeWidth={ICON_STROKE} />
              {label}
            </Link>
          );
        })}
      </nav>

      <p className="mt-auto px-3 pb-2 text-xs leading-snug text-sidebar-foreground/60">
        Ninguém na empresa vê o que você responde.
      </p>
    </aside>
  );
}
