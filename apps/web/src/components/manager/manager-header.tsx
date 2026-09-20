"use client";

import { usePathname } from "next/navigation";
import { ColheitaMark } from "@/components/brand/colheita-mark";
import { NoticeBell } from "@/components/manager/notice-bell";
import { ProfileCard } from "@/components/manager/profile-card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const TITLES: Record<string, string> = {
  "/manager": "Visão geral",
  "/manager/indicadores": "Indicadores",
  "/manager/privacidade": "Privacidade",
};

export function ManagerHeader() {
  const pathname = usePathname();

  return (
    <header className="z-40 h-20 print:hidden">
      <div className="relative grid w-full grid-cols-12 items-center justify-between bg-transparent px-2 py-4 md:flex md:px-7 md:pt-6">
        <div className="col-span-3 flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <h1 className="truncate text-lg font-semibold">
            {TITLES[pathname] ?? "Painel da unidade"}
          </h1>
        </div>

        {/* A marca ao centro só no celular, como na referência. */}
        <div className="col-span-6 flex max-h-[50px] items-center justify-center md:hidden">
          <ColheitaMark className="size-7 text-brand" />
        </div>

        <div className="col-span-3 ml-auto flex items-center space-x-1.5 md:ml-0 lg:space-x-2">
          <div className="flex">
            <NoticeBell />
          </div>
          <Separator
            orientation="vertical"
            className="hidden h-10 md:block"
          />
          <div className="hidden md:flex">
            <ProfileCard />
          </div>
        </div>
      </div>
    </header>
  );
}
