/**
 * Toda declaração pertence a um mês, não a um dia. Normalizar para o primeiro
 * dia em UTC é o que faz a chave única por usuário e mês funcionar, e o que
 * impede que o fuso do cliente jogue a declaração para o mês anterior.
 */
export function normalizeToMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1),
  );
}
