"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginValues } from "@/schemas/auth";
import { FormLayout } from "@/components/form/form-layout";
import { InputField } from "@/components/form/input-field";
import { Button } from "@/components/ui/button";

export function LoginForm({
  onSubmit,
  pending,
  error,
}: {
  onSubmit: (values: LoginValues) => Promise<void>;
  pending: boolean;
  error: string;
}) {
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@backend.com.br", password: "" },
  });
  return (
    <FormLayout form={form} onSubmit={onSubmit}>
      <h2 className="text-lg font-semibold">Entrar na sua conta</h2>
      <InputField
        control={form.control}
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        disabled={pending}
      />
      <InputField
        control={form.control}
        name="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        disabled={pending}
      />
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending || form.formState.isSubmitting}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </FormLayout>
  );
}
