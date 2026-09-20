/**
 * Recursos de apoio que a tela sabe abrir hoje.
 *
 * `CRISIS_LINE` é o CVV 188: serviço público, gratuito, 24h — validado por
 * definição. `SUPPORT_DIRECTORY` é a abertura da própria lista de caminhos, que
 * é o sinal de que a pessoa foi procurar ajuda.
 *
 * Os cinco canais da lista ainda não têm ação própria porque não confirmamos
 * com a Sicredi quais existem (#17). Quando existirem, cada um entra aqui com o
 * seu valor — o contrato foi feito para crescer sem quebrar o que já é contado.
 */
export enum SupportResource {
  CRISIS_LINE = "CRISIS_LINE",
  SUPPORT_DIRECTORY = "SUPPORT_DIRECTORY",
}

export const SUPPORT_RESOURCES: readonly SupportResource[] = [
  SupportResource.CRISIS_LINE,
  SupportResource.SUPPORT_DIRECTORY,
];

/**
 * Ação registrada na auditoria. O contador da unidade lê por ela, então o valor
 * é vocabulário compartilhado entre quem grava e quem conta.
 */
export const SUPPORT_OPENED_ACTION = "support.opened";
