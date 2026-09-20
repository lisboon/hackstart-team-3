import type { ReactNode } from "react";
import { TabBar } from "@/components/layout/tab-bar";
import {
  CARE_DISCLAIMER,
  CRISIS_LINE,
} from "@/components/wellbeing/mood-presentation";
import { SupportSheet } from "@/components/wellbeing/support-sheet";

/**
 * A moldura de celular: 393 pontos lógicos como teto, não como medida — num
 * aparelho de 375 ela encolhe. `100dvh` porque a barra do navegador aparece e
 * some, e a rolagem vive dentro da moldura para o rodapé do CVV nunca sair de
 * vista.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] justify-center bg-background">
      <main className="relative flex h-[100dvh] w-full max-w-[393px] flex-col overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
          {children}
        </div>
        <SafetyFooter />
        <TabBar />
      </main>
    </div>
  );
}

/**
 * O app coleta sofrimento, então acesso a emergência é requisito, não
 * cortesia: alcançável de qualquer tela, inclusive antes do login, com um
 * toque. Junto vem o aviso exigido pelo Anexo V 5.III.
 */
function SafetyFooter() {
  return (
    <footer className="grid gap-1 border-t border-border px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
      <a
        href={CRISIS_LINE.href}
        className="rounded-lg py-1 text-sm font-medium text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {CRISIS_LINE.label} — {CRISIS_LINE.detail}
      </a>
      <SupportSheet />
      <p className="text-xs text-muted-foreground">{CARE_DISCLAIMER}</p>
      {/* Anexo V 4.4: a demonstração roda sobre histórico inventado, e quem vê
          a tela precisa saber disso sem ter que perguntar. */}
      <p className="text-xs text-muted-foreground">
        Demonstração com dados fictícios.
      </p>
    </footer>
  );
}
