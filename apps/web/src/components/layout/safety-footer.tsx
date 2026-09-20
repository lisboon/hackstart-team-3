import { CARE_DISCLAIMER } from "@/components/wellbeing/mood-presentation";
import { SupportSheet } from "@/components/wellbeing/support-sheet";

/**
 * O bloco de segurança: os caminhos de apoio, o aviso do Anexo V 5.III e o de
 * dados fictícios (Anexo V 4.4).
 *
 * DECISÃO DE ESCOPO (aprovada): este bloco deixou de ficar em toda tela e passou
 * a viver só no Perfil, a pedido do produto. O CVV saiu daqui — o acolhimento e
 * os canais vivem no card do final do Perfil (SupportPaths).
 */
export function SafetyFooter() {
  return (
    <footer className="grid gap-1 border-t border-border px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
      <SupportSheet />
      <p className="text-xs text-muted-foreground">{CARE_DISCLAIMER}</p>
      <p className="text-xs text-muted-foreground">
        Demonstração com dados fictícios.
      </p>
    </footer>
  );
}
