import { expect, test, describe } from "vitest";
import { render, screen } from "@testing-library/react";
import { CoopsTrail } from "../src/components/track/coops-trail";
import type { TrackResponse } from "../src/schemas/track";

describe("CoopsTrail", () => {
  test("shows locked stage when answered is 0 and it is not the current stage", () => {
    const mockData: TrackResponse = {
      stages: [
        { stage: "CONSCIENTIZAR", total: 6, answered: 6 },
        { stage: "OBSERVAR", total: 6, answered: 6 },
        { stage: "ORGANIZAR", total: 6, answered: 6 },
        { stage: "PREPARAR", total: 6, answered: 4 },
        { stage: "SUSTENTAR", total: 6, answered: 0 },
      ],
    };

    render(<CoopsTrail data={mockData} />);

    // Preparar is current (answered 4 < 6), Sustentar is locked.
    // The issue asks to prove that with answered: 0 it appears locked and doesn't disappear.
    
    // Sustentar should be present
    expect(screen.getByText("Sustentar")).toBeDefined();
    
    // Its answered count string should be "0 de 6" (or "trancada" if total was 0, but here total is 6)
    expect(screen.getByText("0 de 6")).toBeDefined();

    // Verify progress ring accessibility label
    expect(screen.getByLabelText("Etapa Sustentar, 0 de 6")).toBeDefined();
  });

  test("shows 'trancada' when total is 0", () => {
    const mockData: TrackResponse = {
      stages: [
        { stage: "CONSCIENTIZAR", total: 6, answered: 6 },
        { stage: "OBSERVAR", total: 0, answered: 0 },
      ],
    };

    render(<CoopsTrail data={mockData} />);
    
    // Observar is locked because it comes after Conscientizar which is done.
    expect(screen.getByText("Observar")).toBeDefined();
    // It should render the text "trancada" instead of "0 de 0"
    expect(screen.getAllByText("trancada").length).toBeGreaterThan(0);
  });
});
