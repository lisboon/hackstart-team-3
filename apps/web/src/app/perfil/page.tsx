import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

export default function PerfilPage() {
  return (
    <AppShell>
      <div className="grid gap-4">
        <h1 className="text-xl font-semibold">Perfil</h1>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">
            Sua conta, sua unidade e as suas preferências. Esta tela é construída na issue #8.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
