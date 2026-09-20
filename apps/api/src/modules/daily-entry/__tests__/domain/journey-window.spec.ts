import {
  DEFAULT_JOURNEY_WINDOW,
  JourneyWindow,
  journeyWindowAt,
} from "@/modules/daily-entry/domain/journey-window";

/**
 * Cuiabá é UTC−4 o ano inteiro, então 07:30 local é 11:30Z e 18:00 local é
 * 22:00Z. As bordas são o ponto inteiro do teste: uma checagem em UTC puro
 * abriria a janela às 03:30 da manhã de quem usa — erra por quatro horas e
 * parece quase certa.
 */
const at = (iso: string) => journeyWindowAt(new Date(iso));

describe("journeyWindowAt", () => {
  describe("the edges of a working day", () => {
    it("is still closed one second before opening", () => {
      expect(at("2026-09-21T11:29:59Z").open).toBe(false);
    });

    it("opens exactly at 07:30 local time", () => {
      expect(at("2026-09-21T11:30:00Z").open).toBe(true);
    });

    it("is still open one second before closing", () => {
      expect(at("2026-09-21T21:59:59Z").open).toBe(true);
    });

    it("closes exactly at 18:00 local time", () => {
      expect(at("2026-09-21T22:00:00Z").open).toBe(false);
    });
  });

  it("stays on UTC−4 in January, because Mato Grosso has no daylight saving", () => {
    // 15/01/2026 é uma quinta-feira. Com horário de verão a conversão erraria
    // por uma hora e o teste de borda de setembro não pegaria.
    expect(at("2026-01-15T11:30:00Z").open).toBe(true);
    expect(at("2026-01-15T11:29:59Z").open).toBe(false);
  });

  describe("the weekend", () => {
    it("is closed on Saturday", () => {
      expect(at("2026-09-19T15:00:00Z").open).toBe(false);
    });

    it("is closed on Sunday", () => {
      expect(at("2026-09-20T15:00:00Z").open).toBe(false);
    });

    it("points Saturday at Monday's opening", () => {
      const state = at("2026-09-19T15:00:00Z");
      expect(state.opensAt.toISOString()).toBe("2026-09-21T11:30:00.000Z");
      expect(state.closesAt.toISOString()).toBe("2026-09-21T22:00:00.000Z");
    });
  });

  describe("what it reports while closed", () => {
    it("points at today's opening when the day has not started yet", () => {
      const state = at("2026-09-21T09:00:00Z");
      expect(state.open).toBe(false);
      expect(state.opensAt.toISOString()).toBe("2026-09-21T11:30:00.000Z");
    });

    it("points at tomorrow once today has closed", () => {
      const state = at("2026-09-21T23:00:00Z");
      expect(state.open).toBe(false);
      expect(state.opensAt.toISOString()).toBe("2026-09-22T11:30:00.000Z");
    });

    it("never points at an opening that already passed", () => {
      // Sexta às 19:00 local: a proxima abertura e segunda, nao a de sexta.
      const state = at("2026-09-25T23:00:00Z");
      expect(state.opensAt.toISOString()).toBe("2026-09-28T11:30:00.000Z");
    });
  });

  it("reports the window that is open, not the next one", () => {
    const state = at("2026-09-21T15:00:00Z");
    expect(state.open).toBe(true);
    expect(state.opensAt.toISOString()).toBe("2026-09-21T11:30:00.000Z");
    expect(state.closesAt.toISOString()).toBe("2026-09-21T22:00:00.000Z");
  });

  describe("other configurations", () => {
    const everyDay: JourneyWindow = {
      ...DEFAULT_JOURNEY_WINDOW,
      days: [0, 1, 2, 3, 4, 5, 6],
    };

    it("opens on a Sunday when the unit works on Sundays", () => {
      // É assim que a demonstração roda, e é o mesmo caminho da janela por
      // unidade: configuração, não exceção no código.
      expect(
        journeyWindowAt(new Date("2026-09-20T15:00:00Z"), everyDay).open,
      ).toBe(true);
    });

    it("honours a different time zone", () => {
      // Belém é UTC−3, uma hora à frente de Cuiabá: às 11:30Z já são 08:30 lá,
      // e a janela abriu.
      const belem: JourneyWindow = {
        ...DEFAULT_JOURNEY_WINDOW,
        zone: "America/Belem",
      };
      expect(
        journeyWindowAt(new Date("2026-09-21T10:30:00Z"), belem).open,
      ).toBe(true);
      expect(at("2026-09-21T10:30:00Z").open).toBe(false);
    });

    it("never opens when no day is configured, and says so with a date", () => {
      const closed: JourneyWindow = { ...DEFAULT_JOURNEY_WINDOW, days: [] };
      const state = journeyWindowAt(new Date("2026-09-21T15:00:00Z"), closed);
      expect(state.open).toBe(false);
      expect(state.opensAt.getTime()).toBeGreaterThan(
        new Date("2026-09-21T15:00:00Z").getTime(),
      );
    });
  });
});
