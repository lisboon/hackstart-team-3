"use client";

import { useId } from "react";
import {
  useController,
  type Control,
  type FieldValues,
  type Path,
  type PathValue,
} from "react-hook-form";
import { cn } from "@/lib/utils";

/**
 * Escolha única entre opções fechadas. Usa `input[type=radio]` nativo para
 * manter navegação por teclado e leitores de tela sem reimplementar nada.
 */
export function ChoiceField<T extends FieldValues, N extends Path<T>>({
  control,
  name,
  legend,
  description,
  options,
  disabled,
}: {
  control: Control<T>;
  name: N;
  legend: string;
  description?: string;
  options: readonly {
    value: PathValue<T, N>;
    label: string;
    hint?: string;
  }[];
  disabled?: boolean;
}) {
  const id = useId();
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });
  return (
    <fieldset
      className="m-0 grid min-w-0 gap-3 border-0 p-0"
      aria-describedby={
        error ? id + "-error" : description ? id + "-description" : undefined
      }
    >
      <legend className="text-sm font-medium">{legend}</legend>
      {description && (
        <p id={id + "-description"} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      <div className="grid gap-2">
        {options.map((option, index) => (
          <label
            key={String(option.value)}
            className={cn(
              "flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
              field.value === option.value
                ? "border-primary bg-muted"
                : "border-border hover:bg-muted",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <input
              type="radio"
              name={field.name}
              value={String(option.value)}
              checked={field.value === option.value}
              onChange={() => field.onChange(option.value)}
              onBlur={field.onBlur}
              disabled={disabled}
              ref={index === 0 ? field.ref : undefined}
              className="mt-1 size-4 shrink-0 accent-primary"
            />
            <span className="grid min-w-0 gap-1">
              <span className="text-sm font-semibold">{option.label}</span>
              {option.hint && (
                <span className="text-sm text-muted-foreground">
                  {option.hint}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={id + "-error"} role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </fieldset>
  );
}
