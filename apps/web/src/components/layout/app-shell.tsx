import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-10 md:px-10">
      <header className="mb-8 grid gap-4">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles aria-hidden size={22} />
          <span className="font-semibold">Hackathon Star · NestJS</span>
        </div>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
          Construa o domínio, não o boilerplate.
        </h1>
        <p className="text-muted-foreground">
          Core API · Python · streaming SSE
        </p>
      </header>
      {children}
    </main>
  );
}
