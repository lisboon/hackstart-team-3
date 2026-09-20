import { AppShell } from "@/components/layout/app-shell";
import { AchievementsWorkspace } from "@/components/profile/achievements-workspace";

export default function ConquistasPage() {
  return (
    <AppShell>
      <div className="flex min-h-full w-full flex-col pb-24">
        <AchievementsWorkspace />
      </div>
    </AppShell>
  );
}
