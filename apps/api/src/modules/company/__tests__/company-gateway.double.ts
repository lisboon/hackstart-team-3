import { CompanyGateway } from "../gateway/company.gateway";
import { JourneyWindow } from "../domain/journey-window";

/**
 * A janela da jornada passou a ser lida da unidade (#76), então todo caso de
 * uso que a consulta precisa de um `CompanyGateway`. Um dublê só evita repetir
 * seis `jest.fn()` em cada arquivo — e, onde a janela não é o assunto, evita
 * que o teste pareça ser sobre ela.
 */
export const companyGatewayDouble = (
  overrides: Partial<CompanyGateway> = {},
): jest.Mocked<CompanyGateway> =>
  ({
    findById: jest.fn(),
    findBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findJourneyWindow: jest.fn().mockResolvedValue(null),
    replaceJourneyShifts: jest.fn(),
    findJourneyExceptions: jest.fn().mockResolvedValue([]),
    replaceJourneyExceptions: jest.fn(),
    findTally: jest.fn(),
    countPopulation: jest.fn(),
    ...overrides,
  }) as jest.Mocked<CompanyGateway>;

/** A unidade que nunca fecha: usada onde o horário não é o que se testa. */
export const alwaysOpenUnit = (): jest.Mocked<CompanyGateway> => {
  const window: JourneyWindow = {
    zone: "UTC",
    shifts: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      opensAt: 0,
      closesAt: 1440,
    })),
  };
  return companyGatewayDouble({
    findJourneyWindow: jest.fn().mockResolvedValue(window),
  });
};
