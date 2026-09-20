import {
  CARE_DISCLAIMER,
  CRISIS_LINE,
} from "@/components/wellbeing/mood-presentation";
import { SupportSheet } from "@/components/wellbeing/support-sheet";

/**
 * O bloco de segurança: CVV a um toque, os caminhos de apoio, o aviso do Anexo
 * V 5.III e o de dados fictícios (Anexo V 4.4).
 *
 * DECISÃO DE ESCOPO (aprovada): este bloco deixou de ficar em toda tela e passou
 * a viver só no Perfil, a pedido do produto. É uma reversão consciente da regra
 * anterior ("em toda rota") — ver docs/ia-e-limitacoes.md.
 */
export function SafetyFooter() {
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
      <p className="text-xs text-muted-foreground">
        Demonstração com dados fictícios.
      </p>
    </footer>
  );
}
