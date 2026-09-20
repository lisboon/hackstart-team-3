"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ICON_STROKE } from "@/components/ui/icon";
import { ListRow } from "@/components/ui/list-row";
import { Sheet } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/auth/use-auth";
import { CARE_DISCLAIMER, CRISIS_LINE } from "@/components/wellbeing/mood-presentation";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { PrivacyNote } from "@/components/settings/privacy-note";
import { SignOutDialog } from "@/components/settings/sign-out-dialog";
import {
  SETTINGS_SECTIONS,
  type SettingsItemId,
} from "@/components/settings/settings-presentation";

const PANEL_TITLE: Readonly<Record<SettingsItemId, string>> = {
  "change-password": "Trocar senha",
  privacy: "O que a sua empresa vê",
  about: "Sobre o Colheita",
  "sign-out": "Sair do app",
};

/**
 * Configurações como seção, no padrão que o `shadcn-admin` usa: a lista é
 * gerada de `SETTINGS_SECTIONS`, e cada item abre o seu painel. Uma rota só, e
 * não uma rota por ajuste, porque num aparelho de 393px voltar uma tela a cada
 * item custa mais do que abre de valor.
 *
 * O painel, o Escape e o foco no título são do `Sheet`, o mesmo componente da
 * aba de apoio do rodapé. Devolver o foco à linha que abriu é daqui, que é quem
 * tem a referência dela.
 */
export function SettingsView({ token }: { token: string }) {
  const id = useId();
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState<SettingsItemId | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);

  function close() {
    setOpen(null);
    opener.current?.focus();
  }

  function signOut() {
    logout();
    // A sessão morreu, mas esta rota é de recurso pessoal: sem mandar embora, a
    // pessoa fica olhando a tela de acesso dentro de "Configurações".
    router.replace("/");
  }

  return (
    <div className="grid gap-5">
      <header className="grid gap-3">
        <Link
          href="/perfil"
          className="inline-flex w-fit min-h-11 items-center gap-1 rounded-lg pr-2 text-sm font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ChevronLeft aria-hidden className="size-4" strokeWidth={ICON_STROKE} />
          Perfil
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Configurações</h1>
      </header>

      {SETTINGS_SECTIONS.map((section) => (
        <section key={section.id} className="grid gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {section.title}
          </h2>
          <Card className="gap-1 p-2 md:p-2">
            {section.items.map((item) => (
              <ListRow
                key={item.id}
                label={item.label}
                hint={item.hint}
                aria-expanded={open === item.id}
                aria-controls={`${id}-${item.id}`}
                className={
                  item.tone === "danger" ? "text-destructive" : undefined
                }
                trailing={
                  <ChevronRight
                    aria-hidden
                    className="size-4"
                    strokeWidth={ICON_STROKE}
                  />
                }
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setOpen(item.id);
                }}
              />
            ))}
          </Card>
        </section>
      ))}

      {open && (
        <Sheet id={`${id}-${open}`} title={PANEL_TITLE[open]} onClose={close}>
          {open === "change-password" && (
            <ChangePasswordForm token={token} onChanged={signOut} />
          )}
          {open === "privacy" && <PrivacyNote />}
          {open === "about" && <AboutNote />}
          {open === "sign-out" && (
            <SignOutDialog onCancel={close} onConfirm={signOut} />
          )}
        </Sheet>
      )}
    </div>
  );
}

function AboutNote() {
  return (
    <div className="grid gap-3 text-sm">
      <p>
        O Colheita é um acompanhamento diário de saúde financeira e bem-estar.
        Ele mostra o que você já conseguiu, e nunca define por você quanto
        guardar: quem decide é você.
      </p>
      <p>{CARE_DISCLAIMER}</p>
      <a
        href={CRISIS_LINE.href}
        className="min-h-11 w-fit rounded-lg py-1 font-medium text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {CRISIS_LINE.label} — {CRISIS_LINE.detail}
      </a>
      <p className="text-muted-foreground">
        Demonstração com dados fictícios, feita para o Hackathon SESI Experience
        2026.
      </p>
    </div>
  );
}
