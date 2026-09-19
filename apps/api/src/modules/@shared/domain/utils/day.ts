/**
 * O registro diário pertence a um dia, não a um instante. Normalizar em UTC é o
 * que faz a chave única por usuário e dia funcionar, e o que impede que o fuso
 * do cliente jogue o registro para o dia anterior.
 */
export function normalizeToDayStart(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
