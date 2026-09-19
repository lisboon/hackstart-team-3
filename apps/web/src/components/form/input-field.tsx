"use client";

import { useId, type ComponentProps } from "react";
import {
  useController,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InputField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  ...props
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
} & Omit<
  ComponentProps<"input">,
  "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "id"
>) {
  const id = useId();
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        {...props}
        {...field}
        id={id}
        aria-invalid={!!error}
        aria-describedby={
          error ? id + "-error" : description ? id + "-description" : undefined
        }
      />
      {description && (
        <p id={id + "-description"} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={id + "-error"} className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}
