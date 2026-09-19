"use client";

import { useAiRun } from "@/hooks/ai/use-ai-run";
import { AiPromptForm } from "./ai-prompt-form";
import { Button } from "@/components/ui/button";

export function AiPanel({
  token,
  onUnauthorized,
}: {
  token: string;
  onUnauthorized: () => void;
}) {
  const { answer, status, pending, run, cancel } = useAiRun(
    token,
    onUnauthorized,
  );
  return (
    <section className="grid gap-5 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-xl font-semibold">
        Integração real com o serviço Python
      </h2>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="text-muted-foreground"
      >
        {status}
      </p>
      <div
        className="answer min-h-40 min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]"
        role="region"
        aria-label="Resposta da IA"
        tabIndex={0}
      >
        {answer || "Envie uma pergunta para validar o fluxo completo."}
      </div>
      <AiPromptForm onSubmit={run} pending={pending} />
      {pending && (
        <Button type="button" variant="secondary" onClick={cancel}>
          Cancelar execução
        </Button>
      )}
    </section>
  );
}
