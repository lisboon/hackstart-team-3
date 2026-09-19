import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import OfflinePage from "@/app/offline/page";

// The offline screen is precached and reachable with no network, which makes it
// a screen like any other: issue #13 requires emergency contact one tap away
// from any screen. A phone with no signal is exactly when that matters, so the
// guarantee is pinned here rather than left to visual review.
it("keeps CVV 188 reachable in one tap with no network", () => {
  render(<OfflinePage />);

  const call = screen.getByRole("link", { name: /CVV 188/i });
  expect(call).toHaveAttribute("href", "tel:188");
});

it("states that the app does not diagnose", () => {
  render(<OfflinePage />);

  expect(
    screen.getByText(/não faz diagnóstico e não substitui/i),
  ).toBeInTheDocument();
});
