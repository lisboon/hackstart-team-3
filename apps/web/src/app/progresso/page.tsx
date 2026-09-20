import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

export default function ProgressoPage() {
  return (
    <AppShell>
      <div className="grid gap-4">
        <h1 className="text-xl font-semibold">Progresso</h1>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">
            Seus dias, sua constância e a evolução mês a mês. Esta tela é construída na issue #42.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
