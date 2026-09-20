import { describe, expect, it } from "vitest";
import {
  POINTS_PER_PIECE,
  coopsSections,
  journeyPoints,
} from "@/components/journey/coops-sections";
import type { CoopsStage, JourneyNode } from "@/schemas/wellbeing";

let counter = 0;

function node(
  stage: CoopsStage,
  orderInStage: number,
  state: JourneyNode["state"],
): JourneyNode {
  counter += 1;
  return {
    id: `0000000${counter}-0000-4000-8000-000000000000`.slice(-36),
    stage,
    orderInStage,
    title: `${stage} ${orderInStage}`,
    state,
    body: state === "locked" ? null : "Corpo.",
    prompt: state === "locked" ? null : "E aí?",
    options: state === "current" ? [{ label: "Guardo" }] : null,
    answer: state === "answered" ? "Guardo" : null,
    outcome: state === "answered" ? "Deu certo." : null,
    sourceUrl: "https://www.sicredi.com.br/site/napontadolapis/",
  };
}

describe("coopsSections", () => {
  it("agrupa na ordem do método, não na ordem em que os nós chegam", () => {
    const sections = coopsSections([
      node("SUSTENTAR", 1, "locked"),
      node("CONSCIENTIZAR", 1, "answered"),
      node("PREPARAR", 1, "locked"),
    ]);

    expect(sections.map((section) => section.stage)).toEqual([
      "CONSCIENTIZAR",
      "PREPARAR",
      "SUSTENTAR",
    ]);
  });

  it("ordena as peças de uma etapa pela ordem do método", () => {
    const sections = coopsSections([
      node("OBSERVAR", 3, "locked"),
      node("OBSERVAR", 1, "answered"),
      node("OBSERVAR", 2, "current"),
    ]);

    expect(sections[0].nodes.map((n) => n.orderInStage)).toEqual([1, 2, 3]);
  });

  it("omite etapa sem peça, porque não há o que caminhar nela", () => {
    const sections = coopsSections([node("CONSCIENTIZAR", 1, "answered")]);

    expect(sections).toHaveLength(1);
    expect(sections[0].stage).toBe("CONSCIENTIZAR");
  });

  it("conta quantas peças a etapa tem e quantas foram respondidas", () => {
    const sections = coopsSections([
      node("ORGANIZAR", 1, "answered"),
      node("ORGANIZAR", 2, "answered"),
      node("ORGANIZAR", 3, "current"),
      node("ORGANIZAR", 4, "locked"),
    ]);

    expect(sections[0]).toMatchObject({ total: 4, answered: 2 });
  });

  it("marca como atual apenas a etapa que contém a peça de hoje", () => {
    const sections = coopsSections([
      node("CONSCIENTIZAR", 1, "answered"),
      node("OBSERVAR", 1, "current"),
      node("ORGANIZAR", 1, "locked"),
    ]);

    expect(sections.map((section) => section.state)).toEqual([
      "done",
      "current",
      "locked",
    ]);
    expect(sections.filter((section) => section.state === "current")).toHaveLength(
      1,
    );
  });

  it("só chama a etapa de concluída quando todas as peças dela foram feitas", () => {
    const sections = coopsSections([
      node("PREPARAR", 1, "answered"),
      node("PREPARAR", 2, "locked"),
    ]);

    expect(sections[0].state).toBe("locked");
  });

  it("aguenta uma trilha vazia sem inventar etapa", () => {
    expect(coopsSections([])).toEqual([]);
  });
});

describe("journeyPoints", () => {
  it("conta quinze pontos por peça respondida, e nada pelas outras", () => {
    const points = journeyPoints([
      node("CONSCIENTIZAR", 1, "answered"),
      node("CONSCIENTIZAR", 2, "answered"),
      node("OBSERVAR", 1, "current"),
      node("ORGANIZAR", 1, "locked"),
    ]);

    expect(points).toBe(2 * POINTS_PER_PIECE);
  });

  it("começa em zero para quem ainda não respondeu nada", () => {
    expect(journeyPoints([node("CONSCIENTIZAR", 1, "current")])).toBe(0);
    expect(journeyPoints([])).toBe(0);
  });
});
