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
import { describedBy } from "@/lib/a11y";

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });
  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        {...field}
        id={id}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={describedBy(
          description && id + "-description",
          error && id + "-error",
        )}
      />
      {description && (
        <p id={id + "-description"} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {/* No role="alert" here: react-hook-form focuses the first invalid field
          on submit, and the message is already in aria-describedby, so a live
          region would announce it twice. ChoiceField does use one because focus
          lands on a radio and fieldset descriptions are read less reliably. */}
      {error && (
        <p id={id + "-error"} className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}
