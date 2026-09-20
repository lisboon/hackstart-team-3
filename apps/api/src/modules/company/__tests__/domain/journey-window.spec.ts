import {
  DEFAULT_JOURNEY_WINDOW,
  JourneyWindow,
  MINUTES_IN_DAY,
  journeyWindowAt,
  opensOnDay,
  uniformShifts,
} from "@/modules/company/domain/journey-window";

/**
 * Cuiabá é UTC−4 o ano inteiro, então 07:30 local é 11:30Z e 18:00 local é
 * 22:00Z. As bordas são o ponto inteiro do teste: uma checagem em UTC puro
 * abriria a janela às 03:30 da manhã de quem usa — erra por quatro horas e
 * parece quase certa.
 */
const at = (iso: string) => journeyWindowAt(new Date(iso));

const withShifts = (
  zone: string,
  shifts: JourneyWindow["shifts"],
): JourneyWindow => ({ zone, shifts });

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

    it("points Saturday at the opening on Monday", () => {
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
    it("opens on a Sunday when the unit works on Sundays", () => {
      // É assim que a demonstração roda, e é o mesmo caminho da janela por
      // unidade: configuração, não exceção no código.
      const everyDay = withShifts(
        DEFAULT_JOURNEY_WINDOW.zone,
        uniformShifts([0, 1, 2, 3, 4, 5, 6], 7 * 60 + 30, 18 * 60),
      );
      expect(
        journeyWindowAt(new Date("2026-09-20T15:00:00Z"), everyDay).open,
      ).toBe(true);
    });

    it("honours a different time zone", () => {
      // Belém é UTC−3, uma hora à frente de Cuiabá: às 11:30Z já são 08:30 lá,
      // e a janela abriu. É o erro de uma hora que a #76 existe para apagar.
      const belem = withShifts("America/Belem", DEFAULT_JOURNEY_WINDOW.shifts);
      expect(
        journeyWindowAt(new Date("2026-09-21T10:30:00Z"), belem).open,
      ).toBe(true);
      expect(at("2026-09-21T10:30:00Z").open).toBe(false);
    });

    it("never opens when no shift is configured, and says so with a date", () => {
      const closed = withShifts(DEFAULT_JOURNEY_WINDOW.zone, []);
      const state = journeyWindowAt(new Date("2026-09-21T15:00:00Z"), closed);
      expect(state.open).toBe(false);
      expect(state.opensAt.getTime()).toBeGreaterThan(
        new Date("2026-09-21T15:00:00Z").getTime(),
      );
    });

    it("keeps two shifts on the same day apart", () => {
      // Expediente com intervalo de almoço: 06:00–10:00 e 14:00–18:00.
      const split = withShifts(DEFAULT_JOURNEY_WINDOW.zone, [
        { weekday: 1, opensAt: 6 * 60, closesAt: 10 * 60 },
        { weekday: 1, opensAt: 14 * 60, closesAt: 18 * 60 },
      ]);
      const atSplit = (iso: string) => journeyWindowAt(new Date(iso), split);

      expect(atSplit("2026-09-21T11:00:00Z").open).toBe(true); // 07:00 local
      expect(atSplit("2026-09-21T16:00:00Z").open).toBe(false); // 12:00 local
      // Fechado ao meio-dia, mas a próxima abertura é a da tarde, hoje mesmo.
      expect(atSplit("2026-09-21T16:00:00Z").opensAt.toISOString()).toBe(
        "2026-09-21T18:00:00.000Z",
      );
      expect(atSplit("2026-09-21T19:00:00Z").open).toBe(true); // 15:00 local
    });
  });

  /**
   * O turno da noite é o caso que quebra a implementação ingênua (#77), então
   * ele nasce com teste. 22:00–06:00 são duas faixas em dias diferentes: a
   * segunda fecha em 1440, a terça abre em 0.
   */
  describe("a shift that crosses midnight", () => {
    const nightShift = withShifts(DEFAULT_JOURNEY_WINDOW.zone, [
      { weekday: 1, opensAt: 22 * 60, closesAt: MINUTES_IN_DAY },
      { weekday: 2, opensAt: 0, closesAt: 6 * 60 },
    ]);
    const atNight = (iso: string) => journeyWindowAt(new Date(iso), nightShift);

    it("is open at 23:00 on Monday", () => {
      expect(atNight("2026-09-22T03:00:00Z").open).toBe(true);
    });

    it("is still open at 02:00 on Tuesday", () => {
      expect(atNight("2026-09-22T06:00:00Z").open).toBe(true);
    });

    it("closes the Monday shift exactly at local midnight", () => {
      // 1440 é a meia-noite seguinte, não uma hora de relógio inválida.
      expect(atNight("2026-09-22T03:00:00Z").closesAt.toISOString()).toBe(
        "2026-09-22T04:00:00.000Z",
      );
    });

    it("is closed at 07:00 on Tuesday, once the night shift ended", () => {
      expect(atNight("2026-09-22T11:00:00Z").open).toBe(false);
    });

    it("is closed on Monday morning, before the shift starts", () => {
      const state = atNight("2026-09-21T13:00:00Z"); // 09:00 local, segunda
      expect(state.open).toBe(false);
      expect(state.opensAt.toISOString()).toBe("2026-09-22T02:00:00.000Z");
    });
  });

  /**
   * O cuidado que a #76 nomeia: com a janela vindo da unidade, a conversão de
   * hora de parede para instante deixa de ser trivial em fuso com horário de
   * verão. Lisboa avança para UTC+1 no último domingo de março — 29/03/2026.
   */
  describe("a zone with daylight saving", () => {
    const lisbon = withShifts("Europe/Lisbon", DEFAULT_JOURNEY_WINDOW.shifts);
    const atLisbon = (iso: string) => journeyWindowAt(new Date(iso), lisbon);

    it("opens at 07:30 local before the clocks change", () => {
      // 27/03/2026 é sexta, ainda em UTC+0.
      expect(atLisbon("2026-03-27T07:30:00Z").open).toBe(true);
      expect(atLisbon("2026-03-27T07:29:59Z").open).toBe(false);
    });

    it("still opens at 07:30 local after the clocks change", () => {
      // 30/03/2026 é a segunda seguinte, já em UTC+1: 07:30 local é 06:30Z.
      expect(atLisbon("2026-03-30T06:30:00Z").open).toBe(true);
      expect(atLisbon("2026-03-30T06:29:59Z").open).toBe(false);
    });

    it("points across the change at the right wall clock", () => {
      // Sexta à noite, antes da virada: a próxima abertura é segunda 07:30
      // local, que já é 06:30Z. Uma passada só de deslocamento erraria uma hora.
      const state = atLisbon("2026-03-27T20:00:00Z");
      expect(state.opensAt.toISOString()).toBe("2026-03-30T06:30:00.000Z");
    });
  });
  /**
   * 7 de setembro de 2026 cai numa terça: a janela abriria, o app pediria a
   * diária, e ninguém estaria trabalhando. Pelo mesmo argumento que sustenta a
   * janela — art. 4º da CLT — pedir a diária num feriado é pedir exatamente o
   * que ela existe para não pedir (#77).
   */
  describe("a day the unit does not work", () => {
    const withHoliday = (...dates: string[]): JourneyWindow => ({
      ...DEFAULT_JOURNEY_WINDOW,
      exceptions: dates,
    });

    it("stays closed on a holiday that falls on a working day", () => {
      const holiday = withHoliday("2026-09-08");
      // Terça, 09:00 em Cuiabá: seria dentro da janela em qualquer outro dia.
      expect(
        journeyWindowAt(new Date("2026-09-08T13:00:00Z"), holiday).open,
      ).toBe(false);
      expect(at("2026-09-08T13:00:00Z").open).toBe(true);
    });

    it("points at the next working day, skipping the holiday", () => {
      const holiday = withHoliday("2026-09-08");
      const state = journeyWindowAt(new Date("2026-09-08T13:00:00Z"), holiday);
      expect(state.opensAt.toISOString()).toBe("2026-09-09T11:30:00.000Z");
    });

    it("walks across a whole shutdown instead of giving up after a week", () => {
      // Recesso de fim de ano: de 21/12 a 01/01 a fábrica para. Uma busca de
      // sete dias à frente não alcançaria a reabertura.
      const recess = withHoliday(
        "2026-12-21",
        "2026-12-22",
        "2026-12-23",
        "2026-12-24",
        "2026-12-25",
        "2026-12-28",
        "2026-12-29",
        "2026-12-30",
        "2026-12-31",
        "2027-01-01",
      );
      const state = journeyWindowAt(new Date("2026-12-21T13:00:00Z"), recess);
      expect(state.open).toBe(false);
      // 04/01/2027 é a segunda-feira seguinte ao recesso.
      expect(state.opensAt.toISOString()).toBe("2027-01-04T11:30:00.000Z");
    });

    it("tells the streak which calendar days never opened", () => {
      const holiday = withHoliday("2026-09-08");
      // Segunda abre, terça é feriado, sábado nunca abriu.
      expect(opensOnDay(holiday, new Date("2026-09-07T00:00:00Z"))).toBe(true);
      expect(opensOnDay(holiday, new Date("2026-09-08T00:00:00Z"))).toBe(false);
      expect(opensOnDay(holiday, new Date("2026-09-12T00:00:00Z"))).toBe(false);
    });
  });
});
