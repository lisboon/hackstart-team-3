"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ICON_STROKE } from "@/components/ui/icon";
import { useProfile } from "@/hooks/profile/use-profile";
import type { AuthUser } from "@/services/auth/auth-service";
import {
  completedStages,
  milestones,
  trackRatio,
} from "@/components/profile/achievements-presentation";
import {
  initials,
  formatMemberSince,
  profileStats,
} from "@/components/profile/profile-presentation";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileMilestones } from "@/components/profile/profile-milestones";
import { ProfileStats } from "@/components/profile/profile-stats";

/**
 * Perfil: o retrato do que a pessoa já construiu. A ordem é deliberada —
 * identidade, o que ela já fez, os marcos que alcançou — e os ajustes ficam
 * atrás da engrenagem, porque configuração não é o assunto desta tela.
 *
 * Nenhum número aqui é moeda, prêmio ou comparação com outra pessoa: o cliente
 * recusou premiação, e o produto mostra o que ela já conseguiu em vez de dizer
 * o que ela deveria conseguir.
 *
 * O nome vem da sessão e não do cadastro carregado: ele já está em memória
 * quando a tela abre, então o cabeçalho não espera a rede para dizer quem é.
 */
export function ProfileView({
  token,
  user,
  onUnauthorized,
}: {
  token: string;
  user: AuthUser | null;
  onUnauthorized: () => void;
}) {
  const { data, error, loading, reload } = useProfile(token, onUnauthorized);
  // A sessão responde na hora e o cadastro responde depois, mas é o cadastro que
  // manda: se um administrador corrigiu o nome, o do token está velho.
  const name = data?.account.name ?? user?.name ?? "Perfil";

  return (
    <div className="grid gap-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Meu perfil</h1>
        <Link
          href="/perfil/configuracoes"
          aria-label="Configurações"
          className="grid size-11 place-items-center rounded-xl border border-border text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Settings aria-hidden className="size-5" strokeWidth={ICON_STROKE} />
        </Link>
      </header>

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="text-sm text-muted-foreground"
      >
        {loading ? "Carregando o seu perfil…" : ""}
      </p>

      {error && !data && (
        <>
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto sm:justify-self-start"
            onClick={() => void reload()}
          >
            Tentar de novo
          </Button>
        </>
      )}

      {data && (
        <>
          <ProfileHeader
            name={name}
            initials={initials(name)}
            avatarUrl={data.account.avatarUrl}
            organizationName={data.organization.name}
            memberSince={formatMemberSince(data.account.createdAt)}
            trackRatio={trackRatio(data.track)}
            completedStages={completedStages(data.track)}
            totalStages={data.track.stages.length}
          />
          <ProfileStats
            stats={profileStats({
              account: data.account,
              summary: data.summary,
              track: data.track,
            })}
          />
          <ProfileMilestones
            milestones={milestones(data.summary, data.track)}
          />
        </>
      )}
    </div>
  );
}
