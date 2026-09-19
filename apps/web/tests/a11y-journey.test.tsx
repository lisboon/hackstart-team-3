import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { PersonalSummary } from "@/components/financial-health/personal-summary";
import type { PersonalSummary as Summary } from "@/schemas/financial-health";

// Journey-level guarantees from issue #15: focus survives a view change, and the
// loading state is announced rather than only drawn. Field-level guarantees live
// in a11y-fields.test.tsx; the data rules for this screen live in
// financial-health.test.tsx and are not repeated here.

const summary: Summary = {
  currentMonth: "2026-09-01T00:00:00.000Z",
  currentSituation: "SURPLUS",
  recentAverage: 2.67,
  previousAverage: 0.33,
  declaredMonths: 6,
};

function respondWith(payload: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(payload)),
  );
}

function renderScreen() {
  return render(<PersonalSummary token="session" onUnauthorized={vi.fn()} />);
}

it("announces that it is loading instead of only showing a blank card", async () => {
  // A never-settling request keeps the screen in its loading state.
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise<Response>(() => {})),
  );
  renderScreen();

  // role=status with aria-live=polite: someone who cannot see the card still
  // learns that something is on its way.
  const status = screen.getByRole("status");
  expect(status).toHaveTextContent(/Carregando/i);
  expect(status).toHaveAttribute("aria-live", "polite");
});

it("stops announcing the loading state once the summary arrives", async () => {
  respondWith(summary);
  renderScreen();

  await screen.findByText("Sobrou");
  expect(screen.getByRole("status")).toHaveTextContent("");
});

it("does not drop focus when the correction form replaces the button", async () => {
  respondWith(summary);
  renderScreen();

  await userEvent.click(await screen.findByRole("button", { name: /Corrigir/ }));

  // Clicking unmounts the button that had focus. Without deliberate focus
  // management the browser falls back to document.body, so a keyboard or screen
  // reader user is never told that a form appeared.
  await waitFor(() =>
    expect(screen.getByRole("radio", { name: /Sobrou/ })).toBeInTheDocument(),
  );
  expect(document.activeElement).not.toBe(document.body);
  expect(document.activeElement).toContainElement(
    screen.getByRole("radio", { name: /Sobrou/ }),
  );
});

it("leaves focus alone on first load when no month is declared", async () => {
  respondWith({
    ...summary,
    currentSituation: null,
    recentAverage: null,
    previousAverage: null,
    declaredMonths: 0,
  });
  renderScreen();

  // The form is on screen because nothing was declared yet, not because the
  // person asked to change anything. Stealing focus here would drag a screen
  // reader past the heading that explains where they are.
  await screen.findByText(/ainda não contou/);
  expect(document.activeElement).toBe(document.body);
});
