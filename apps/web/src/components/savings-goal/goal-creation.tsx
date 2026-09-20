"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { parseReaisToCents } from "@/lib/money";
import type { SavingsGoalKind } from "@/schemas/savings-goal";
import { GOAL_KIND_LABEL } from "./savings-goal-presentation";

const ENDURING_MONTHS = [3, 6, 12] as const;

/**
 * Criação da meta: a pessoa escolhe o horizonte e o valor-alvo (em reais, que a
 * tela converte para centavos). ENDURING pede também por quantos meses; o alvo
 * mensal é o valor dividido pelos meses, mostrado no cartão.
 */
export function GoalCreation({
  pending,
  onCreate,
}: {
  pending: boolean;
  onCreate: (
    kind: SavingsGoalKind,
    targetAmountCents: number,
    targetMonths?: number,
  ) => void;
}) {
  const amountId = useId();
  const [kind, setKind] = useState<SavingsGoalKind | null>(null);
  const [months, setMonths] = useState<number>(6);
  const [amount, setAmount] = useState("");

  const cents = parseReaisToCents(amount);
  const canSubmit = Boolean(kind) && cents !== null;

  return (
    <Card aria-label="Nova meta de guarda">
      <h2 className="text-base font-semibold">Criar uma meta de guarda</h2>
      <p className="text-sm text-muted-foreground">
        Escolha o horizonte e quanto quer guardar. É um valor que você define
        para si — o app não acessa conta nem saldo.
      </p>

      <div role="group" aria-label="Tipo de meta" className="grid gap-2">
        {(Object.keys(GOAL_KIND_LABEL) as SavingsGoalKind[]).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={kind === option}
            onClick={() => setKind(option)}
            className={cn(
              "rounded-xl border p-3 text-left text-sm transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              kind === option
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted",
            )}
          >
            {GOAL_KIND_LABEL[option]}
          </button>
        ))}
      </div>

      <div className="grid gap-1">
        <label htmlFor={amountId} className="text-sm font-medium">
          {kind === "ENDURING" ? "Quanto quer guardar no total?" : "Quanto quer guardar?"}
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
          <span aria-hidden className="text-sm text-muted-foreground">
            R$
          </span>
          <input
            id={amountId}
            inputMode="decimal"
            placeholder="200,00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {kind === "ENDURING" && (
        <div role="group" aria-label="Por quantos meses" className="grid gap-2">
          <p className="text-sm">Por quantos meses?</p>
          <div className="flex gap-2">
            {ENDURING_MONTHS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={months === m}
                onClick={() => setMonths(m)}
                className={cn(
                  "rounded-xl border px-4 py-2 text-sm transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  months === m
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted",
                )}
              >
                {m} meses
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        type="button"
        disabled={pending || !canSubmit}
        className="w-full sm:w-auto sm:justify-self-start"
        onClick={() =>
          kind &&
          cents !== null &&
          onCreate(kind, cents, kind === "ENDURING" ? months : undefined)
        }
      >
        Criar meta
      </Button>
    </Card>
  );
}
