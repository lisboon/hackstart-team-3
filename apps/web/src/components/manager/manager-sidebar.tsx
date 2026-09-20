"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartNoAxesColumn, LayoutDashboard, ShieldCheck } from "lucide-react";
import { ColheitaMark } from "@/components/brand/colheita-mark";
import { ICON_STROKE } from "@/components/ui/icon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const ITEMS = [
  { href: "/manager", label: "Visão geral", Icon: LayoutDashboard },
  { href: "/manager/indicadores", label: "Indicadores", Icon: ChartNoAxesColumn },
  { href: "/manager/privacidade", label: "Privacidade", Icon: ShieldCheck },
] as const;

export function ManagerSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <ColheitaMark className="size-6 shrink-0 text-brand" />
          <span className="truncate text-base font-semibold group-data-[collapsible=icon]:hidden">
            Colheita
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Unidade</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ITEMS.map(({ href, label, Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === href}
                    tooltip={label}
                  >
                    <Link href={href}>
                      <Icon aria-hidden strokeWidth={ICON_STROKE} />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* O que o gestor não vê é parte do produto, não letra miúda. */}
        <p className="px-2 pb-1 text-xs leading-snug text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
          Só números de unidade. Nenhum dado de uma pessoa.
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
