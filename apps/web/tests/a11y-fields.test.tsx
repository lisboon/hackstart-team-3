import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expect, it } from "vitest";
import { z } from "zod";
import { ChoiceField } from "@/components/form/choice-field";
import { FormLayout } from "@/components/form/form-layout";
import { InputField } from "@/components/form/input-field";
import { TextareaField } from "@/components/form/textarea-field";
import { describedBy } from "@/lib/a11y";

// Issue #15 asks for label, description and error associated to every field,
// plus focus on the first invalid one. Those are the field primitives the whole
// journey is built from, so pinning them here covers screens that do not exist
// yet: MoodPrompt (#10) and DailyCard (#11) inherit the guarantee for free.

const schema = z.object({
  email: z.string().min(1, "Informe o seu e-mail"),
  note: z.string().min(1, "Escreva a sua resposta"),
  choice: z.enum(["a", "b"], { message: "Escolha uma opção" }),
});

const OPTIONS = [
  { value: "a" as const, label: "Primeira" },
  { value: "b" as const, label: "Segunda" },
] as const;

function Subject() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", note: "" },
  });
  return (
    <FormLayout form={form} onSubmit={async () => {}}>
      <InputField
        control={form.control}
        name="email"
        label="E-mail"
        description="Usamos só para entrar."
      />
      <TextareaField
        control={form.control}
        name="note"
        label="Sua resposta"
        description="Escreva com as suas palavras."
      />
      <ChoiceField
        control={form.control}
        name="choice"
        legend="Como foi o mês?"
        description="Sem valor em dinheiro."
        options={OPTIONS}
      />
      <button type="submit">Enviar</button>
    </FormLayout>
  );
}

/** Text announced to a screen reader through aria-describedby. */
function announced(element: HTMLElement): string {
  const ids = element.getAttribute("aria-describedby")?.split(" ") ?? [];
  return ids
    .map((id) => element.ownerDocument.getElementById(id)?.textContent ?? "")
    .join(" ");
}

it("associates the label with every control", () => {
  render(<Subject />);

  // getByLabelText only resolves through a real label/control association.
  expect(screen.getByLabelText("E-mail")).toBeInstanceOf(HTMLInputElement);
  expect(screen.getByLabelText("Sua resposta")).toBeInstanceOf(
    HTMLTextAreaElement,
  );
  // The radio group is named by its legend.
  expect(
    screen.getByRole("group", { name: "Como foi o mês?" }),
  ).toBeInTheDocument();
});

it("announces the description before submit", () => {
  render(<Subject />);

  expect(announced(screen.getByLabelText("E-mail"))).toContain(
    "Usamos só para entrar.",
  );
  expect(announced(screen.getByLabelText("Sua resposta"))).toContain(
    "Escreva com as suas palavras.",
  );
});

it("keeps the description announced once the field is invalid", async () => {
  render(<Subject />);
  await userEvent.click(screen.getByRole("button", { name: "Enviar" }));

  // The regression this guards: an error replacing the description instead of
  // joining it, which drops the instruction exactly when it is needed.
  for (const [label, description, message] of [
    ["E-mail", "Usamos só para entrar.", "Informe o seu e-mail"],
    ["Sua resposta", "Escreva com as suas palavras.", "Escreva a sua resposta"],
  ]) {
    const text = announced(screen.getByLabelText(label));
    expect(text).toContain(description);
    expect(text).toContain(message);
  }

  const group = screen.getByRole("group", { name: "Como foi o mês?" });
  expect(announced(group)).toContain("Sem valor em dinheiro.");
  expect(announced(group)).toContain("Escolha uma opção");
});

it("marks invalid controls and moves focus to the first one", async () => {
  render(<Subject />);
  await userEvent.click(screen.getByRole("button", { name: "Enviar" }));

  const email = screen.getByLabelText("E-mail");
  expect(email).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByLabelText("Sua resposta")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  // Without this the person is left on the submit button with no idea where the
  // problem is.
  expect(email).toHaveFocus();
});

it("does not double announce a text field error as a live region", async () => {
  render(<Subject />);
  await userEvent.click(screen.getByRole("button", { name: "Enviar" }));

  // Focus plus aria-describedby already reads it; an alert would repeat it. The
  // radio group is the deliberate exception, since focus lands on a radio.
  expect(screen.getAllByRole("alert").map((node) => node.textContent)).toEqual([
    "Escolha uma opção",
  ]);
});

it("keeps the description and the error in a single describedby list", () => {
  // The rule lives in one helper so the three primitives cannot drift apart.
  expect(describedBy("a-description", "a-error")).toBe(
    "a-description a-error",
  );
  expect(describedBy(false, "a-error")).toBe("a-error");
  expect(describedBy("a-description", undefined)).toBe("a-description");
  expect(describedBy(false, null, undefined)).toBeUndefined();
});
