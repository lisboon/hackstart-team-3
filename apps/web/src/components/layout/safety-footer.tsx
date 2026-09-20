import { CARE_DISCLAIMER } from "@/components/wellbeing/mood-presentation";

/**
 * O bloco de segurança no rodapé do Perfil: o aviso do Anexo V 5.III e o de
 * dados fictícios (Anexo V 4.4).
 *
 * DECISÃO DE ESCOPO (aprovada): o CVV e o gatilho de apoio saíram daqui — o
 * acolhimento e os canais vivem no card do final do Perfil (SupportPaths).
 */
export function SafetyFooter() {
  return (
    <footer className="grid gap-1 border-t border-border px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
      <p className="text-xs text-muted-foreground">{CARE_DISCLAIMER}</p>
      <p className="text-xs text-muted-foreground">
        Demonstração com dados fictícios.
      </p>
    </footer>
  );
}
