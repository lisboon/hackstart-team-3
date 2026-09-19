import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

export default function ConquistasPage() {
  return (
    <AppShell>
      <div className="grid gap-4">
        <h1 className="text-xl font-semibold">Conquistas</h1>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">
            Os marcos que você alcançou. Nenhum deles vale ponto ou troca por nada. Esta tela é construída na issue #8.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
