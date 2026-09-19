"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { aiPromptSchema, type AiPromptValues } from "@/schemas/ai";
import { FormLayout } from "@/components/form/form-layout";
import { TextareaField } from "@/components/form/textarea-field";
import { Button } from "@/components/ui/button";

export function AiPromptForm({
  onSubmit,
  pending,
}: {
  onSubmit: (prompt: string) => Promise<void>;
  pending: boolean;
}) {
  const form = useForm<AiPromptValues>({
    resolver: zodResolver(aiPromptSchema),
    defaultValues: { prompt: "" },
  });
  return (
    <FormLayout form={form} onSubmit={({ prompt }) => onSubmit(prompt)}>
      <TextareaField
        control={form.control}
        name="prompt"
        label="Descreva o contexto e o resultado esperado"
        disabled={pending}
      />
      <Button type="submit" disabled={pending}>
        Enviar
      </Button>
    </FormLayout>
  );
}
