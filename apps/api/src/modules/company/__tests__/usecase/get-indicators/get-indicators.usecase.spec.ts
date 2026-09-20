import { CompanyGateway } from "../../../gateway/company.gateway";
import { companyGatewayDouble } from "../../company-gateway.double";
import {
  MINIMUM_GROUP_SIZE,
  UnitPopulation,
  UnitTally,
} from "../../../domain/unit-indicators";
import GetUnitIndicatorsUseCase from "../../../usecase/get-indicators/get-indicators.usecase";

const companyId = "7a2c4d6e-1b3f-4c5d-8e9f-0a1b2c3d4e5f";
const midSeptember = new Date(Date.UTC(2026, 8, 19, 14, 30));

const tally = (over: Partial<UnitTally> = {}): UnitTally => ({
  active: 10,
  declarers: 8,
  tightDeclarers: 3,
  moodPeople: 10,
  averageMood: 3.5,
  entries: 42,
  supportUses: 7,
  accessSeries: [],
  ...over,
});

const gatewayWith = (
  current: UnitTally,
  previous: UnitTally = tally(),
  population: UnitPopulation = { headcount: 20, reach: 14 },
): CompanyGateway =>
  companyGatewayDouble({
    countPopulation: jest.fn().mockResolvedValue(population),
    findTally: jest
      .fn()
      .mockResolvedValueOnce(current)
      .mockResolvedValueOnce(previous),
  });

const run = (gateway: CompanyGateway) =>
  new GetUnitIndicatorsUseCase(gateway).execute({
    companyId,
    today: midSeptember,
  });

describe("GetUnitIndicatorsUseCase", () => {
  it("reports the unit when every population is large enough", async () => {
    const output = await run(gatewayWith(tally()));

    expect(output.suppressed).toBe(false);
    expect(output.active).toBe(10);
    expect(output.headcount).toBe(20);
    expect(output.reach).toBe(14);
    expect(output.tightRatio).toBe(0.375);
    expect(output.averageMood).toBe(3.5);
    expect(output.frequency).toBe(4.2);
    // Aberturas de apoio caem com o portão geral, não com uma população própria:
    // acima do mínimo, a contagem da unidade passa inteira.
    expect(output.supportUses).toBe(7);
  });

  it("hides the whole panel below the minimum group size", async () => {
    const output = await run(
      gatewayWith(tally({ active: MINIMUM_GROUP_SIZE - 1 })),
    );

    expect(output.suppressed).toBe(true);
    // Nem o tamanho do grupo sai: se a regra vivesse na tela, bastaria o
    // DevTools para lê-la.
    expect(output.active).toBeNull();
    expect(output.headcount).toBeNull();
    expect(output.reach).toBeNull();
    expect(output.frequency).toBeNull();
    // A contagem de apoio cai junto com o painel: abaixo do mínimo, nem o total
    // da unidade sai.
    expect(output.supportUses).toBeNull();
    expect(output.tightRatio).toBeNull();
    expect(output.averageMood).toBeNull();
    expect(output.previous).toBeNull();
  });

  it("releases the panel exactly at the minimum, not one person later", async () => {
    const output = await run(
      gatewayWith(
        tally({ active: MINIMUM_GROUP_SIZE, moodPeople: MINIMUM_GROUP_SIZE }),
      ),
    );

    expect(output.suppressed).toBe(false);
  });

  it("hides a declaration ratio drawn from too few declarers", async () => {
    // Dez ativos, mas só três declararam o mês: a proporção é uma estatística
    // de três pessoas, e publicá-la porque as outras sete registraram humor
    // seria o mesmo vazamento entrando pela porta de trás.
    const output = await run(
      gatewayWith(tally({ declarers: 3, tightDeclarers: 2 })),
    );

    expect(output.suppressed).toBe(false);
    expect(output.tightRatio).toBeNull();
    expect(output.averageMood).toBe(3.5);
  });

  it("hides a mood average drawn from too few people", async () => {
    const output = await run(
      gatewayWith(tally({ moodPeople: 2, averageMood: 1.5, entries: 8 })),
    );

    expect(output.suppressed).toBe(false);
    expect(output.averageMood).toBeNull();
    // A frequência sai da mesma população do humor e cai junto.
    expect(output.frequency).toBeNull();
    expect(output.tightRatio).toBe(0.375);
  });

  it("applies the same gate to the previous month", async () => {
    const output = await run(
      gatewayWith(
        tally(),
        tally({ declarers: 2, tightDeclarers: 2, moodPeople: 1 }),
      ),
    );

    expect(output.previous).toEqual({ tightRatio: null, averageMood: null });
  });

  it("carries the previous month when it also had enough people", async () => {
    const output = await run(
      gatewayWith(
        tally(),
        tally({ declarers: 10, tightDeclarers: 7, averageMood: 2.5 }),
      ),
    );

    expect(output.previous).toEqual({ tightRatio: 0.7, averageMood: 2.5 });
  });

  it("divides the daily count by the people who kept a daily record", async () => {
    // 42 registros de 10 pessoas com humor, não dos 14 ativos: quem só
    // declarou o mês não entra no denominador de uma conta sobre o diário.
    const output = await run(
      gatewayWith(tally({ active: 14, moodPeople: 10, entries: 42 })),
    );

    expect(output.frequency).toBe(4.2);
  });

  it("asks for the current month and the one before it", async () => {
    const gateway = gatewayWith(tally());
    await run(gateway);

    expect(gateway.findTally).toHaveBeenNthCalledWith(1, companyId, {
      from: new Date(Date.UTC(2026, 8, 1)),
      to: new Date(Date.UTC(2026, 9, 1)),
    });
    expect(gateway.findTally).toHaveBeenNthCalledWith(2, companyId, {
      from: new Date(Date.UTC(2026, 7, 1)),
      to: new Date(Date.UTC(2026, 8, 1)),
    });
  });

  it("returns null instead of dividing by zero when nobody took part", async () => {
    const output = await run(
      gatewayWith(
        tally({
          declarers: 0,
          tightDeclarers: 0,
          averageMood: null,
          entries: 0,
        }),
      ),
    );

    expect(output.tightRatio).toBeNull();
    expect(output.averageMood).toBeNull();
  });

  it("reports how many people used the app on each day", async () => {
    const output = await run(
      gatewayWith(
        tally({
          accessSeries: [
            { date: new Date(Date.UTC(2026, 8, 1)), people: 8 },
            { date: new Date(Date.UTC(2026, 8, 2)), people: 6 },
          ],
        }),
      ),
    );

    // O dia vai como data pura: um instante com fuso faria a barra pular de
    // dia dependendo de quem le a tela.
    expect(output.accessSeries).toEqual([
      { date: "2026-09-01", people: 8 },
      { date: "2026-09-02", people: 6 },
    ]);
  });

  it("hides the series when the unit is suppressed", async () => {
    const output = await run(
      gatewayWith(
        tally({
          active: MINIMUM_GROUP_SIZE - 1,
          accessSeries: [{ date: new Date(Date.UTC(2026, 8, 1)), people: 3 }],
        }),
      ),
    );

    // Uma serie diaria de grupo pequeno entrega mais do que a media, nao
    // menos: um dia com uma pessoa e uma pessoa identificavel.
    expect(output.accessSeries).toBeNull();
  });
});
