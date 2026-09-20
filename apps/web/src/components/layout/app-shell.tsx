import type { ReactNode } from "react";
import { TabBar } from "@/components/layout/tab-bar";

/**
 * A moldura de celular: 393 pontos lógicos como teto, não como medida — num
 * aparelho de 375 ela encolhe. `100dvh` porque a barra do navegador aparece e
 * some, e a rolagem vive dentro da moldura.
 *
 * O bloco de segurança (CVV, aviso) não fica mais aqui: por decisão de produto
 * ele vive só no Perfil (ver SafetyFooter e docs/ia-e-limitacoes.md).
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] justify-center bg-background">
      <main className="relative flex h-[100dvh] w-full max-w-[393px] flex-col overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
          {children}
        </div>
        <TabBar />
      </main>
    </div>
  );
}
