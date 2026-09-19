import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

export default function TrilhaPage() {
  return (
    <AppShell>
      <div className="grid gap-4">
        <h1 className="text-xl font-semibold">Trilha COOPS</h1>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">
            As cinco etapas do método, com o quanto você já andou em cada uma. Esta tela é construída na issue #44.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
