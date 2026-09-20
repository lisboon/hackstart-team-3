import BaseUseCase from "@/modules/@shared/usecase/base.usecase";

export interface GetProgressUseCaseInputDto {
  userId: string;
  companyId: string;
  today: Date;
}

/**
 * Os dias do mês corrente em que a pessoa registrou alguma coisa, para o
 * histograma da tela Progresso.
 *
 * Dia sem registro é **ausência de dado, nunca punição**: ele simplesmente não
 * está em `days`, e a tela o desenha como barra vazia — sem alerta, sem
 * sequência zerada, sem cobrança. É por isso que nada aqui conta faltas.
 */
export interface GetProgressUseCaseOutputDto {
  /** Primeiro dia do mês, em UTC. O mês é o do relógio do servidor. */
  month: Date;
  /** Quantos dias o mês tem, para a tela desenhar a grade sem recontar. */
  daysInMonth: number;
  /** Os dias do mês com registro, de 1 a 31, em ordem crescente. */
  days: number[];
  /** Quantos dias do mês têm registro. */
  total: number;
}

export type GetProgressUseCaseInterface = BaseUseCase<
  GetProgressUseCaseInputDto,
  GetProgressUseCaseOutputDto
>;
