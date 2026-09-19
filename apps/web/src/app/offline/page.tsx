import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sem conexão · Colheita",
};

// Fallback served by the service worker when a navigation fails. It is
// precached, so it has to be reachable with no network and no API call.
//
// It carries CVV 188 because this is a screen, and issue #13 requires emergency
// access one tap away from any screen. A phone with no signal on a night shift
// is exactly a moment where that matters.
export default function OfflinePage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-md content-center gap-6 px-5 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        Você está sem conexão
      </h1>
      <p className="text-muted-foreground">
        Sua lição de hoje volta assim que a internet voltar. Nada do que você já
        registrou foi perdido.
      </p>

      <section
        aria-labelledby="apoio-offline"
        className="grid gap-3 rounded-2xl border border-border bg-card p-5"
      >
        <h2 id="apoio-offline" className="text-lg font-semibold">
          Precisa falar com alguém agora?
        </h2>
        <p className="text-muted-foreground">
          O CVV atende 24 horas, de graça, e a ligação funciona sem internet.
        </p>
        <Button asChild>
          <a href="tel:188">Ligar para o CVV 188</a>
        </Button>
        <p className="text-sm text-muted-foreground">
          Este aplicativo não faz diagnóstico e não substitui atendimento
          profissional.
        </p>
      </section>
    </main>
  );
}
