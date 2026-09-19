import BaseUseCase from "@/modules/@shared/usecase/base.usecase";

export interface GetUnitIndicatorsUseCaseInputDto {
  companyId: string;
  today: Date;
}

export interface UnitPeriodIndicators {
  tightRatio: number | null;
  averageMood: number | null;
}

/**
 * Todo indicador é anulável porque a supressão zera a resposta inteira. O
 * painel nunca recebe um número que não pode mostrar: se a regra vivesse só na
 * tela, bastaria abrir o DevTools para furá-la.
 *
 * `headcount`, `reach` e `active` são contagens de pessoas, não percentuais —
 * alcance e adesão saem da divisão, e devolver os três crus deixa a tela
 * escolher como apresentar sem precisar de um quarto campo derivado.
 */
export interface GetUnitIndicatorsUseCaseOutputDto extends UnitPeriodIndicators {
  suppressed: boolean;
  headcount: number | null;
  reach: number | null;
  active: number | null;
  frequency: number | null;
  previous: UnitPeriodIndicators | null;
}

export interface GetUnitIndicatorsUseCaseInterface extends BaseUseCase<
  GetUnitIndicatorsUseCaseInputDto,
  GetUnitIndicatorsUseCaseOutputDto
> {
  execute(
    data: GetUnitIndicatorsUseCaseInputDto,
  ): Promise<GetUnitIndicatorsUseCaseOutputDto>;
}
