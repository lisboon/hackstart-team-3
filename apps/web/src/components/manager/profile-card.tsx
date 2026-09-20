"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/auth/use-auth";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ICON_STROKE } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { initials } from "@/components/profile/profile-presentation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
          <Avatar initials={initials(name)} className="size-10 rounded-full text-sm" />
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
