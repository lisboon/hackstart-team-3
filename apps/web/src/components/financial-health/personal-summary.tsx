"use client";

import { useEffect, useRef, useState } from "react";
import { usePersonalSummary } from "@/hooks/financial-health/use-personal-summary";
import type { SelfReportSituation } from "@/schemas/financial-health";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  className,
}: {
  token: string;
  onUnauthorized: () => void;
  className?: string;
}) {
  const { summary, error, loading, pending, declare, reload } =
    usePersonalSummary(token, onUnauthorized);
  const [correcting, setCorrecting] = useState(false);
  const correctionRef = useRef<HTMLDivElement>(null);

  // Asking to correct unmounts the button that had focus, which drops focus to
  // the body: a keyboard or screen reader user is left with no idea that a form
  // appeared. Moving focus into the form keeps the reading order intact. Only on
  // an explicit correction, never on first load, so arriving on the screen does
  // not yank focus away from the top.
  useEffect(() => {
    if (correcting) correctionRef.current?.focus();
  }, [correcting]);

  async function submit(situation: SelfReportSituation) {
    if (await declare(situation)) setCorrecting(false);
  }

  return (
    <Card className={`gap-6${className ? ` ${className}` : ""}`}>
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
            <div ref={correctionRef} tabIndex={-1} className="min-w-0">
              <SelfReportForm
                current={summary.currentSituation}
                pending={pending}
                onSubmit={submit}
              />
            </div>
          )}
          <TrajectoryPanel summary={summary} />
        </>
      )}
    </Card>
  );
}
