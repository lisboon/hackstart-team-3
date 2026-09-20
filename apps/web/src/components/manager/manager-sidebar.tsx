"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartNoAxesColumn, LayoutDashboard, ShieldCheck } from "lucide-react";
import { ColheitaMark } from "@/components/brand/colheita-mark";
import { ICON_STROKE } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/manager", label: "Visão geral", Icon: LayoutDashboard },
  { href: "/manager/indicadores", label: "Indicadores", Icon: ChartNoAxesColumn },
  { href: "/manager/privacidade", label: "Privacidade", Icon: ShieldCheck },
] as const;

/**
 * Três destinos fixos numa coluna fixa. Não recolhe e não vira gaveta: o painel
 * do gestor é de desktop, e as duas coisas existiam só porque vinham de brinde
 * com o componente de prateleira que estava aqui antes — 773 linhas, mais
 * `tooltip`, `skeleton` e um detector de viewport, para desenhar isto.
 */
export function ManagerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r border-border bg-card px-4 py-6 md:flex">
      <div className="flex items-center gap-2 px-2">
        <ColheitaMark className="size-6 shrink-0 text-brand" />
        <span className="text-base font-semibold">Colheita</span>
      </div>

      <nav aria-label="Painel da unidade" className="grid gap-1">
        {ITEMS.map(({ href, label, Icon }) => {
          const current = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                current
                  ? "bg-muted text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon aria-hidden className="size-4" strokeWidth={ICON_STROKE} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* O que o gestor não vê é parte do produto, não letra miúda. */}
      <p className="mt-auto px-2 text-xs leading-snug text-muted-foreground">
        Só números de unidade. Nenhum dado de uma pessoa.
      </p>
    </aside>
  );
}
