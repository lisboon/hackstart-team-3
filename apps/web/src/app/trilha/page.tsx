"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGate } from "@/components/auth/auth-gate";
import { CoopsTrail } from "@/components/track/coops-trail";
import { fetchTrack } from "@/services/track/track-service";
import type { Track } from "@/schemas/track";
import { useAuth } from "@/hooks/auth/use-auth";

function TrilhaPageContent() {
  const { token } = useAuth();
  const [data, setData] = useState<Track | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    fetchTrack(token, controller.signal)
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : "Erro ao carregar a trilha");
        }
      });
    return () => controller.abort();
  }, [token]);

  if (error) {
    return (
      <div className="flex-1 grid place-items-center p-6 text-center text-destructive">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 grid place-items-center p-6 text-muted-foreground animate-pulse">
        Carregando trilha...
      </div>
    );
  }

  // The answered count for the overall progress is not in the Track root,
  // but we can compute it to show at the top like in the design:
  // "Trilha COOPS | X de Y"
  const answeredStages = data.stages.filter((s) => s.answered >= s.total && s.total > 0).length;
  const totalStages = data.stages.length;

  return (
    <div className="mx-auto w-full max-w-md pb-24">
      <header className="px-6 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-[1.2rem] leading-tight">Trilha COOPS</h1>
          <span className="text-[0.68rem] text-muted-foreground tabular-nums">
            {answeredStages} de {totalStages}
          </span>
        </div>
      </header>
      <main className="px-6 pb-8">
        <CoopsTrail data={data} />
      </main>
    </div>
  );
}

export default function TrilhaPage() {
  return (
    <AuthGate>
      {() => (
        <AppShell>
          <TrilhaPageContent />
        </AppShell>
      )}
    </AuthGate>
  );
}
