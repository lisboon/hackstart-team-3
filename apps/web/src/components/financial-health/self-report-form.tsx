"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  selfReportSchema,
  type SelfReportSituation,
  type SelfReportValues,
} from "@/schemas/financial-health";
import { FormLayout } from "@/components/form/form-layout";
import { ChoiceField } from "@/components/form/choice-field";
import { Button } from "@/components/ui/button";
import { SITUATION_CHOICES } from "./summary-presentation";

export function SelfReportForm({
  current,
  pending,
  onSubmit,
}: {
  current: SelfReportSituation | null;
  pending: boolean;
  onSubmit: (situation: SelfReportSituation) => Promise<void>;
}) {
  const form = useForm<SelfReportValues>({
    resolver: zodResolver(selfReportSchema),
    defaultValues: { situation: current ?? undefined },
  });
  return (
    <FormLayout form={form} onSubmit={({ situation }) => onSubmit(situation)}>
      <ChoiceField
        control={form.control}
        name="situation"
        legend="Como este mês fechou para você?"
        description="Sem valor em dinheiro, sem comprovação. Só a sua leitura do mês."
        options={SITUATION_CHOICES}
        disabled={pending}
      />
      <Button type="submit" disabled={pending}>
        {pending
          ? "Registrando…"
          : current
            ? "Corrigir declaração"
            : "Registrar declaração"}
      </Button>
    </FormLayout>
  );
}
