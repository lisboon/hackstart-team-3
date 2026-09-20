import { ApiProperty } from "@nestjs/swagger";

export class AccessDayResponseDto {
  date: string;
  people: number;
}

export class UnitPeriodIndicatorsResponseDto {
  tightRatio: number | null;
  averageMood: number | null;
}

/**
 * Tudo é anulável porque a supressão zera a resposta inteira: abaixo do grupo
 * mínimo o painel recebe `suppressed: true` e nenhum número, em vez de receber
 * os valores e decidir na tela se mostra.
 */
export class UnitIndicatorsResponseDto {
  suppressed: boolean;
  headcount: number | null;
  reach: number | null;
  active: number | null;
  frequency: number | null;
  supportUses: number | null;
  tightRatio: number | null;
  averageMood: number | null;
  /**
   * Declarado à mão: o plugin do Swagger não alcança a classe quando ela está
   * dentro de um array anulável, e o schema sai do contrato sem ninguém notar.
   */
  @ApiProperty({ type: () => [AccessDayResponseDto], nullable: true })
  accessSeries: AccessDayResponseDto[] | null;
  previous: UnitPeriodIndicatorsResponseDto | null;
}
