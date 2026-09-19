"use client";

import type { ReactNode } from "react";
import type {
  FieldValues,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";
import { cn } from "@/lib/utils";

export function FormLayout<T extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
}: {
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("grid gap-5", className)}
    >
      {children}
    </form>
  );
}
