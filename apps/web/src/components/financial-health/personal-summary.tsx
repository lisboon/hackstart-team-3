"use client";

import { useState } from "react";
import { usePersonalSummary } from "@/hooks/financial-health/use-personal-summary";
import type { SelfReportSituation } from "@/schemas/financial-health";
import { Button } from "@/components/ui/button";
import { SelfReportForm } from "./self-report-form";
import { TrajectoryPanel } from "./trajectory-panel";
import {
  formatMonth,
  SITUATION_LABEL,
  SUMMARY_WINDOW_MONTHS,
} from "./summary-presentation";

export function PersonalSummary({
  token,
  onUnauthorized,
}: {
  token: string;
  onUnauthorized: () => void;
}) {
  const { summary, error, loading, pending, declare, reload } =
    usePersonalSummary(token, onUnauthorized);
  const [correcting, setCorrecting] = useState(false);

  async function submit(situation: SelfReportSituation) {
    if (await declare(situation)) setCorrecting(false);
  }

  return (
    <section className="grid min-w-0 gap-6 rounded-2xl border border-border bg-card p-5 md:p-6">
      <header className="grid gap-1">
        <p className="text-sm text-muted-foreground">Seu mês</p>
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          {summary ? formatMonth(summary.currentMonth) : "Resumo pessoal"}
        </h2>
      </header>
      <p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-muted-foreground">
        {loading ? "Carregando seu resumo…" : ""}
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!summary && !loading && error && (
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto sm:justify-self-start"
          onClick={() => void reload()}
        >
          Tentar de novo
        </Button>
      )}
      {summary && (
        <>
          <div className="grid gap-2">
            {summary.currentSituation ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Sua declaração deste mês
                </p>
                <p className="text-lg font-semibold">
                  {SITUATION_LABEL[summary.currentSituation]}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Você ainda não contou como este mês fechou. É essa declaração
                que move a sua trajetória.
              </p>
            )}
            {summary.declaredMonths > 0 && (
              <p className="text-sm text-muted-foreground">
                Você registrou {summary.declaredMonths} de{" "}
                {SUMMARY_WINDOW_MONTHS} meses desta janela.
              </p>
            )}
          </div>
          {summary.currentSituation && !correcting ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto sm:justify-self-start"
              onClick={() => setCorrecting(true)}
            >
              Corrigir a declaração deste mês
            </Button>
          ) : (
            <SelfReportForm
              current={summary.currentSituation}
              pending={pending}
              onSubmit={submit}
            />
          )}
          <TrajectoryPanel summary={summary} />
        </>
      )}
    </section>
  );
}
