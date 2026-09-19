import type { ReactNode } from "react";
import {
  CARE_DISCLAIMER,
  CRISIS_LINE,
} from "@/components/wellbeing/mood-presentation";

/**
 * A jornada é de celular, e continua sendo de celular no desktop: a moldura
 * prende a largura e desenha um aparelho em volta, em vez de esticar o
 * conteúdo por uma tela de 1920px.
 *
 * `100dvh` no lugar de `100vh` porque a barra do navegador móvel aparece e
 * some — com `vh` o rodapé fica cortado metade do tempo.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] justify-center bg-muted md:py-8">
      <main className="flex h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden bg-background md:h-[calc(100dvh-4rem)] md:rounded-[2rem] md:border md:border-border md:shadow-2xl">
        {/* A rolagem vive aqui dentro, nunca na página: é o que mantém o
            rodapé do CVV à vista enquanto o conteúdo corre. */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
          {children}
        </div>
        <SafetyFooter />
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
    <footer className="border-t border-border px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
      <a
        href={CRISIS_LINE.href}
        className="block rounded-lg py-1 text-sm font-medium text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {CRISIS_LINE.label} — {CRISIS_LINE.detail}
      </a>
      <p className="pt-1 text-xs text-muted-foreground">{CARE_DISCLAIMER}</p>
      {/* Anexo V 4.4: a demonstração roda sobre histórico inventado, e quem vê
          a tela precisa saber disso sem ter que perguntar. */}
      <p className="text-xs text-muted-foreground">
        Demonstração com dados fictícios.
      </p>
    </footer>
  );
}
