import { Workspace } from "@/components/auth/workspace";
import { AppShell } from "@/components/layout/app-shell";

export default function Home() {
  return (
    <AppShell>
      <Workspace />
    </AppShell>
  );
}
