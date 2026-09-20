"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "@/schemas/account";
import { changePassword } from "@/services/account/account-service";
import { FormLayout } from "@/components/form/form-layout";
import { InputField } from "@/components/form/input-field";
import { Button } from "@/components/ui/button";

/**
 * Trocar a própria senha — a única coisa que o perfil grava, porque é a única
 * que a API expõe para quem não é `ADMIN`. Nome, e-mail e foto são editáveis só
 * por administrador (`PATCH /users/:id`), então a tela não finge oferecer isso.
 *
 * O aviso vem antes do formulário e não depois do sucesso: o servidor chama
 * `invalidateTokens()`, a sessão morre em todo aparelho, e descobrir isso sendo
 * desconectado no meio do dia seria uma surpresa desnecessária.
 */
export function ChangePasswordForm({
  token,
  onChanged,
}: {
  token: string;
  onChanged: () => void;
}) {
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmation: "" },
  });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const active = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      active.current?.abort();
      active.current = null;
    },
    [],
  );

  async function submit(values: ChangePasswordValues) {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setPending(true);
    setError("");
    try {
      await changePassword(token, values, controller.signal);
      if (active.current === controller) onChanged();
    } catch (cause) {
      if (active.current === controller && !controller.signal.aborted)
        setError(
          cause instanceof Error ? cause.message : "Falha ao trocar a senha.",
        );
    } finally {
      if (active.current === controller) {
        active.current = null;
        setPending(false);
      }
    }
  }

  return (
    <FormLayout form={form} onSubmit={submit}>
      <p className="text-sm text-muted-foreground">
        Ao trocar a senha, a sua sessão é encerrada em todos os aparelhos e você
        entra de novo com a senha nova.
      </p>
      <InputField
        control={form.control}
        name="currentPassword"
        label="Senha atual"
        type="password"
        autoComplete="current-password"
        disabled={pending}
      />
      <InputField
        control={form.control}
        name="newPassword"
        label="Nova senha"
        description="Pelo menos 8 caracteres."
        type="password"
        autoComplete="new-password"
        disabled={pending}
      />
      <InputField
        control={form.control}
        name="confirmation"
        label="Repita a nova senha"
        type="password"
        autoComplete="new-password"
        disabled={pending}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending || form.formState.isSubmitting}>
        {pending ? "Trocando…" : "Trocar senha"}
      </Button>
    </FormLayout>
  );
}
