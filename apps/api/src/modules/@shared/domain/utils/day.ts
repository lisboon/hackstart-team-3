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

/** Soma (ou subtrai) dias, sempre no início do dia UTC. */
export function addDays(date: Date, amount: number): Date {
  const base = normalizeToDayStart(date);
  return new Date(
    Date.UTC(
      base.getUTCFullYear(),
      base.getUTCMonth(),
      base.getUTCDate() + amount,
    ),
  );
}

/** Diferença em dias inteiros entre duas datas (b - a), no início do dia UTC. */
export function daysBetween(a: Date, b: Date): number {
  const ms =
    normalizeToDayStart(b).getTime() - normalizeToDayStart(a).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * A segunda-feira da semana da data, no início do dia UTC. A semana do cartão
 * de Colheita vai de segunda a domingo; `getUTCDay` dá 0 para domingo, então
 * ajustamos para tratar domingo como fim (offset 6).
 */
export function startOfWeekMonday(date: Date): Date {
  const day = normalizeToDayStart(date);
  const weekday = (day.getUTCDay() + 6) % 7; // 0 = segunda … 6 = domingo
  return addDays(day, -weekday);
}
