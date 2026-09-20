import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TabBar } from "@/components/layout/tab-bar";
import {
  CARE_DISCLAIMER,
  CRISIS_LINE,
} from "@/components/wellbeing/mood-presentation";
import { SupportSheet } from "@/components/wellbeing/support-sheet";

/**
 * Duas formas, uma árvore.
 *
 * **Celular:** largura de aparelho (393, os pontos lógicos do iPhone 16, teto e
 * não medida — num aparelho de 375 ela encolhe), altura em `100dvh` porque a
 * barra do navegador aparece e some, rolagem presa dentro da moldura, barra de
 * abas e rodapé de cuidado embaixo.
 *
 * **Desktop:** menu lateral, cabeçalho com a conta, conteúdo largo e rolagem
 * da própria página. Quem quiser ver o celular abre o modo dispositivo do
 * navegador.
 *
 * As duas moldura trocam por CSS, mas `children` é montado **uma vez**:
 * duplicar a árvore como a referência faz criaria dois formulários com o mesmo
 * `id` e dobraria toda requisição da tela.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] justify-center bg-background md:justify-start">
      <AppSidebar />
      <main className="relative flex h-[100dvh] w-full max-w-[393px] flex-col overflow-hidden bg-background md:h-auto md:min-h-[100dvh] md:max-w-none md:flex-1 md:overflow-visible">
        <AppHeader />
        {/* No celular a rolagem vive aqui dentro, para o rodapé do CVV nunca
            sair de vista. No desktop quem rola é a página. */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))] md:overflow-visible md:px-8 md:pb-10 md:pt-0">
          <div className="md:max-w-3xl">{children}</div>
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
