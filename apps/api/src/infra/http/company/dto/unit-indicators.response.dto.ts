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
  tightRatio: number | null;
  averageMood: number | null;
  previous: UnitPeriodIndicatorsResponseDto | null;
}
