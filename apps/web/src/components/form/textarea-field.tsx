"use client";

import { useId } from "react";
import {
  useController,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  disabled?: boolean;
}) {
  const id = useId();
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        {...field}
        id={id}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? id + "-error" : undefined}
      />
      {error && (
        <p id={id + "-error"} className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}
