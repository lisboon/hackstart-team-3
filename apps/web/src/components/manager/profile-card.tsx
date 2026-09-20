"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/auth/use-auth";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ICON_STROKE } from "@/components/ui/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Duas letras bastam, e "Ana Paula Souza" vira AS, não APS. */
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === "") return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function ProfileCard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const name = user?.name ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label="Sua conta"
        >
          <Avatar className="size-10">
            {/* Sem `src` por enquanto. Quando as fotos entrarem pela Cloudflare
                é uma propriedade aqui, não uma refatoração. */}
            <AvatarImage alt="" />
            <AvatarFallback className="bg-muted text-sm font-semibold">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="grid gap-0.5">
          <span className="truncate font-semibold">{name || "Sua conta"}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {user?.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between px-2 py-1.5 text-sm">
          <span>Tema</span>
          <ThemeToggle className="size-9" />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            logout();
            router.push("/");
          }}
        >
          <LogOut aria-hidden strokeWidth={ICON_STROKE} />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
