import {
  addMonths,
  normalizeToMonthStart,
} from "@/modules/@shared/domain/utils/month";
import { CompanyGateway } from "../../gateway/company.gateway";
import { MINIMUM_GROUP_SIZE, UnitTally } from "../../domain/unit-indicators";
import {
  GetUnitIndicatorsUseCaseInputDto,
  GetUnitIndicatorsUseCaseInterface,
  GetUnitIndicatorsUseCaseOutputDto,
  UnitPeriodIndicators,
} from "./get-indicators.usecase.dto";

/** Sem arredondar, a média chega como 3.799999999999999 na tela do gestor. */
const round = (value: number, places: number) => Number(value.toFixed(places));

/**
 * Cada indicador é suprimido pela população de onde ele sai, não pelo total de
 * gente ativa na unidade. Dez pessoas ativas das quais só três declararam o mês
 * produzem uma estatística de três pessoas — e publicá-la porque *outras sete*
 * registraram humor é o mesmo vazamento, entrando pela porta de trás.
 */
const overGroup = <T>(population: number, value: T): T | null =>
  population >= MINIMUM_GROUP_SIZE ? value : null;

const indicatorsOf = (tally: UnitTally): UnitPeriodIndicators => ({
  tightRatio: overGroup(
    tally.declarers,
    tally.declarers === 0
      ? null
      : round(tally.tightDeclarers / tally.declarers, 4),
  ),
  averageMood: overGroup(
    tally.moodPeople,
    tally.averageMood === null ? null : round(tally.averageMood, 2),
  ),
});

const SUPPRESSED: GetUnitIndicatorsUseCaseOutputDto = {
  suppressed: true,
  headcount: null,
  reach: null,
  active: null,
  frequency: null,
  supportUses: null,
  tightRatio: null,
  averageMood: null,
  previous: null,
};

export default class GetUnitIndicatorsUseCase implements GetUnitIndicatorsUseCaseInterface {
  constructor(private readonly companyGateway: CompanyGateway) {}

  async execute(
    data: GetUnitIndicatorsUseCaseInputDto,
  ): Promise<GetUnitIndicatorsUseCaseOutputDto> {
    const monthStart = normalizeToMonthStart(data.today);
    const [tally, previous, population] = await Promise.all([
      this.companyGateway.findTally(data.companyId, {
        from: monthStart,
        to: addMonths(monthStart, 1),
      }),
      this.companyGateway.findTally(data.companyId, {
        from: addMonths(monthStart, -1),
        to: monthStart,
      }),
      this.companyGateway.countPopulation(data.companyId),
    ]);

    // O portão da tela inteira olha quem registrou algo no mês corrente. Abaixo
    // disso não há painel: nem os totais de unidade saem.
    if (tally.active < MINIMUM_GROUP_SIZE) {
      return SUPPRESSED;
    }

    return {
      suppressed: false,
      headcount: population.headcount,
      reach: population.reach,
      active: tally.active,
      // Sem `overGroup`: aberturas de apoio não têm população própria de
      // declarantes. Elas caem com o portão geral, como headcount e reach.
      supportUses: tally.supportUses,
      // Dias com registro por pessoa que registrou. Dividir pelos ativos
      // misturaria quem só declarou o mês no denominador de uma conta que é
      // só sobre o diário.
      frequency: overGroup(
        tally.moodPeople,
        tally.moodPeople === 0
          ? null
          : round(tally.entries / tally.moodPeople, 2),
      ),
      ...indicatorsOf(tally),
      previous: indicatorsOf(previous),
    };
  }
}
