import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { PieceExplanation } from "@/components/journey/piece-explanation";
import { runAi } from "@/services/ai/ai-service";
import { HttpError } from "@/lib/http/client";
import type { ContentPiece } from "@/schemas/wellbeing";

vi.mock("@/services/ai/ai-service", () => ({ runAi: vi.fn() }));

const piece: ContentPiece = {
  id: "8b3d5f7a-2c4e-4d6f-9a1b-3c5d7e9f0a1b",
  stage: "PREPARAR",
  title: "O imprevisto não avisa",
  body: "Preparar é ter alguma folga antes de precisar.",
  prompt: "Sobraram R$ 50 este mês. O que fazer?",
  options: [{ label: "Guardar, mesmo sendo pouco" }],
  sourceUrl: "https://www.sicredi.com.br/site/napontadolapis/",
};

function explanation(onUnauthorized = vi.fn()) {
  return render(
    <PieceExplanation
      piece={piece}
      token="session"
      onUnauthorized={onUnauthorized}
    />,
  );
}

async function ask() {
  await userEvent.click(
    screen.getByRole("button", { name: "Explicar esta peça" }),
  );
}

it("asks the model to translate the approved content and cite the source", async () => {
  vi.mocked(runAi).mockResolvedValueOnce("Guardar pouco e sempre já conta.");
  explanation();
  await ask();
  expect(await screen.findByText(/Guardar pouco/)).toBeInTheDocument();
  const [prompt, token] = vi.mocked(runAi).mock.calls[0];
  expect(prompt).toContain(piece.title);
  expect(prompt).toContain(piece.body);
  expect(prompt).toContain(piece.sourceUrl);
  expect(prompt).toContain("Preparar");
  expect(token).toBe("session");
});

it("never carries personal data nor invites advice", async () => {
  vi.mocked(runAi).mockResolvedValueOnce("ok");
  explanation();
  await ask();
  const [prompt] = vi.mocked(runAi).mock.calls[0];
  expect(prompt).not.toMatch(/humor|situação declarada|SURPLUS|sobrou/i);
  expect(prompt).toMatch(/não dê conselho financeiro específico/i);
  expect(prompt).toMatch(/não fale de sentimentos/i);
});

it("stopping leaves no half answer passing for an explanation", async () => {
  vi.mocked(runAi).mockImplementationOnce(
    async (_prompt, _token, _signal, onDelta) => {
      onDelta("metade da fra");
      return new Promise<string>(() => {});
    },
  );
  explanation();
  await ask();
  expect(await screen.findByText("metade da fra")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Parar" }));
  expect(screen.queryByText("metade da fra")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Explicar esta peça" }),
  ).toBeInTheDocument();
});

it("reports a failure in plain words, never in upstream jargon", async () => {
  vi.mocked(runAi).mockRejectedValueOnce(new Error("AI provider failed"));
  explanation();
  await ask();
  const notice = await screen.findByRole("alert");
  expect(notice).toHaveTextContent(/A peça acima continua valendo/);
  expect(notice.textContent).not.toMatch(/provider|failed|error/i);
});

it("ends the session when the token no longer works", async () => {
  const onUnauthorized = vi.fn();
  vi.mocked(runAi).mockRejectedValueOnce(new HttpError(401));
  explanation(onUnauthorized);
  await ask();
  expect(onUnauthorized).toHaveBeenCalledTimes(1);
});
