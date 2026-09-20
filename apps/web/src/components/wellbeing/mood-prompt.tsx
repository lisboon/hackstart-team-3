"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAX_MOOD_NOTE_LENGTH, type MoodScale } from "@/schemas/wellbeing";
import { MOOD_LEVELS, moodLabel } from "./mood-presentation";
import { WEATHER_ICON } from "./mood-weather-icons";

/**
 * A pergunta de humor, integrada no topo da Home. Botão, não rádio: num grupo
 * de rádios a seta do teclado trocaria a seleção. O texto saiu dos botões (só
 * o ícone do tempo); como a cor sozinha não indica estado (WCAG 1.4.1), o
 * rótulo vai no `aria-label`.
 *
 * O toque não registra na hora (#91): abre um `<dialog>` de confirmação, com um
 * campo opcional para a pessoa especificar o que está sentindo. Registrar é
 * sempre uma escolha explícita — "Registrar", "Não responder" confirmam o dia,
 * e fechar o diálogo não grava nada.
 *
 * É um `<dialog>` nativo renderizado com o atributo `open` (sem `showModal`,
 * que o jsdom dos testes não implementa): mantém a semântica de diálogo, com
 * foco no título ao abrir, Escape e clique no fundo para fechar.
 */
export function MoodPrompt({
  pending,
  error,
  onConfirm,
}: {
  pending: boolean;
  error: string;
  onConfirm: (mood: MoodScale, note?: string) => void;
}) {
  const id = useId();
  const noteId = useId();
  const titleId = useId();
  // O tempo escolhido fica pendente de confirmação até a pessoa registrar ou
  // desistir: enquanto isso, o diálogo está aberto sobre ele.
  const [choice, setChoice] = useState<MoodScale | null>(null);
  const [note, setNote] = useState("");
  const triggers = useRef(new Map<MoodScale, HTMLButtonElement | null>());
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (choice !== null) heading.current?.focus();
  }, [choice]);

  function reset() {
    setChoice(null);
    setNote("");
  }

  function close() {
    const focusBack = choice;
    reset();
    if (focusBack !== null) triggers.current.get(focusBack)?.focus();
  }

  function confirm(withNote: boolean) {
    if (choice === null) return;
    onConfirm(choice, withNote ? note : undefined);
    // Não devolve o foco: a confirmação recarrega o dia e a pergunta sai da
    // tela. Só limpamos o estado local.
    reset();
  }

  const FOCUSABLE =
    'a[href], button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /** Prende a tabulação dentro do diálogo: `aria-modal` promete isso. */
  function trap(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const stops = dialog.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!stops || stops.length === 0) return;
    const first = stops[0];
    const last = stops[stops.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === heading.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const ChoiceWeather = choice !== null ? WEATHER_ICON[choice] : null;

  return (
    <Card aria-labelledby={id} className="gap-3 rounded-b-none">
      <h2 id={id} className="text-base font-semibold">
        Como está o seu tempo hoje?
      </h2>
      <p className="text-sm text-muted-foreground">
        Um toque abre a confirmação. Ninguém além de você vê esta resposta.
      </p>
      <div role="group" aria-labelledby={id} className="grid grid-cols-5 gap-2">
        {MOOD_LEVELS.map((level) => {
          const Weather = WEATHER_ICON[level.value];
          const selected = choice === level.value;
          return (
            <button
              key={level.value}
              ref={(node) => {
                triggers.current.set(level.value, node);
              }}
              type="button"
              aria-label={level.label}
              aria-haspopup="dialog"
              disabled={pending}
              onClick={() => setChoice(level.value)}
              className={cn(
                "grid min-h-14 place-items-center rounded-2xl border p-2 transition",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                "disabled:pointer-events-none",
                selected
                  ? "border-2 border-primary bg-primary/5 text-primary ring-2 ring-primary/10"
                  : "border-border text-muted-foreground hover:border-foreground/30 disabled:opacity-50",
              )}
            >
              <Weather />
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {choice !== null && ChoiceWeather && (
        <>
          {/* Fundo escuro: um toque fora do diálogo fecha sem registrar. */}
          <div
            aria-hidden
            className="absolute inset-0 z-10 bg-foreground/40"
            onClick={close}
          />
          <dialog
            ref={dialog}
            open
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={trap}
            className="absolute inset-x-0 bottom-0 z-20 m-0 grid w-full max-w-full gap-3 rounded-t-2xl border border-border bg-card p-5 text-foreground shadow-xl"
          >
            <h3
              id={titleId}
              ref={heading}
              tabIndex={-1}
              className="flex items-center gap-2 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <span
                aria-hidden
                className="grid size-9 place-items-center rounded-xl border border-primary bg-primary/5 text-primary"
              >
                <ChoiceWeather />
              </span>
              {moodLabel(choice)}
            </h3>
            <p className="text-sm text-muted-foreground">
              Oi! Que bom que você compartilhou como está hoje. Quer especificar
              mais o que está sentindo?
            </p>
            <label htmlFor={noteId} className="text-sm font-medium">
              Se quiser, conte um pouco (opcional)
            </label>
            <Textarea
              id={noteId}
              value={note}
              maxLength={MAX_MOOD_NOTE_LENGTH}
              onChange={(event) => setNote(event.target.value)}
              placeholder="O que está pesando ou animando hoje…"
            />
            <p className="text-xs text-muted-foreground">
              É só seu. Nunca aparece para o gestor.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                disabled={pending}
                onClick={() => confirm(true)}
              >
                Registrar
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => confirm(false)}
              >
                Não responder
              </Button>
            </div>
            <button
              type="button"
              onClick={close}
              className="justify-self-center text-sm font-medium text-muted-foreground underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Voltar
            </button>
            <p role="status" aria-live="polite" className="text-sm">
              {pending ? `Registrando: ${moodLabel(choice)}` : ""}
            </p>
          </dialog>
        </>
      )}
    </Card>
  );
}
