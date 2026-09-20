import { AppShell } from "@/components/layout/app-shell";
import { SafetyFooter } from "@/components/layout/safety-footer";
import { ProfileWorkspace } from "@/components/profile/profile-workspace";

export default function PerfilPage() {
  return (
    <AppShell>
      <ProfileWorkspace />
      {/* Por decisão de produto, o bloco de segurança (CVV, aviso, dados
          fictícios) vive só aqui, no Perfil. */}
      <SafetyFooter />
    </AppShell>
  );
}
