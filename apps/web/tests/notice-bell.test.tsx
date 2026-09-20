import { describe, expect, it } from "vitest";
import { noticesFrom } from "@/components/manager/notice-bell";
import type { UnitIndicators } from "@/schemas/organization";

const OPEN: UnitIndicators = {
  suppressed: false,
  headcount: 20,
  reach: 14,
  active: 10,
  frequency: 4.2,
  supportUses: 0,
  tightRatio: 0.4,
  averageMood: 3.5,
  accessSeries: [{ date: "2026-09-01", people: 8 }],
  previous: { tightRatio: 0.4, averageMood: 3.4 },
};

describe("avisos do gestor", () => {
  it("does not invent a notice when there is nothing to say", () => {
    expect(noticesFrom(OPEN)).toEqual([]);
  });

  it("says nothing at all before the data arrives", () => {
    // Sino cheio antes da resposta seria enfeite: nao ha o que avisar ainda.
    expect(noticesFrom(null)).toEqual([]);
  });

  it("explains the suppression instead of showing a silent empty panel", () => {
    const notices = noticesFrom({ ...OPEN, suppressed: true });

    expect(notices).toHaveLength(1);
    expect(notices[0].title).toMatch(/Dados insuficientes/i);
  });

  it("reports support openings without naming anyone", () => {
    const notices = noticesFrom({ ...OPEN, supportUses: 23 });
    const support = notices.find((notice) => notice.id === "support");

    expect(support?.title).toMatch(/23 aberturas/);
    // O evento nao guarda ator, e o aviso nao pode sugerir que guarda.
    expect(support?.detail).toMatch(/sem identificar/i);
  });

  it("compares the month with the previous one, in points", () => {
    const notices = noticesFrom({
      ...OPEN,
      tightRatio: 0.52,
      previous: { tightRatio: 0.4, averageMood: 3.4 },
    });

    expect(notices.find((n) => n.id === "tight")?.title).toMatch(/subiu 12/);
  });

  it("stays quiet when the month barely moved", () => {
    const notices = noticesFrom({
      ...OPEN,
      tightRatio: 0.404,
      previous: { tightRatio: 0.4, averageMood: 3.4 },
    });

    // Menos de um ponto e ruido: avisar sobre isso treina o gestor a ignorar
    // o sino.
    expect(notices.find((n) => n.id === "tight")).toBeUndefined();
  });

  it("never mentions a person, in any state", () => {
    const states: UnitIndicators[] = [
      OPEN,
      { ...OPEN, suppressed: true },
      { ...OPEN, supportUses: 23, tightRatio: 0.6 },
      { ...OPEN, accessSeries: [] },
    ];

    for (const state of states) {
      const text = JSON.stringify(noticesFrom(state));
      // "quem declara aperto" e coletivo e pode ficar. O que nao pode e algo
      // que aponte para uma pessoa: e-mail, identificador ou nome proprio.
      expect(text).not.toMatch(/@|userId|id:/i);
      expect(text).not.toMatch(/fulano|colaborador [A-Z]/);
    }
  });
});
