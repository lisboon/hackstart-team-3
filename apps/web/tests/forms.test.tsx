import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/login-form";
import { AiPromptForm } from "@/components/ai/ai-prompt-form";

describe("forms", () => {
  it("associates errors and focuses the first invalid field", async () => {
    const submit = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onSubmit={submit} pending={false} error="" />);
    const email = screen.getByLabelText("E-mail");
    await user.clear(email);
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(email).toHaveFocus());
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription("Informe um e-mail válido.");
    expect(submit).not.toHaveBeenCalled();
  });
  it("submits credentials once while pending", async () => {
    const submit = vi.fn<
      (values: { email: string; password: string }) => Promise<void>
    >(() => new Promise(() => {}));
    const user = userEvent.setup();
    render(<LoginForm onSubmit={submit} pending={false} error="" />);
    await user.clear(screen.getByLabelText("E-mail"));
    await user.type(screen.getByLabelText("E-mail"), "person@example.test");
    await user.type(screen.getByLabelText("Senha"), "x");
    await user.dblClick(screen.getByRole("button", { name: "Entrar" }));
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0][0]).toEqual({
      email: "person@example.test",
      password: "x",
    });
  });
  it("renders authentication errors", () => {
    render(
      <LoginForm
        onSubmit={vi.fn()}
        pending={false}
        error="Credenciais inválidas."
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Credenciais inválidas.",
    );
  });
  it("does not submit a blank AI prompt", async () => {
    const submit = vi.fn();
    render(<AiPromptForm onSubmit={submit} pending={false} />);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Enviar" }));
    expect(
      await screen.findByText("Descreva o que você precisa."),
    ).toBeVisible();
    expect(submit).not.toHaveBeenCalled();
  });
});
