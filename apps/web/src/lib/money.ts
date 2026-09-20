/**
 * Dinheiro em centavos (inteiro) para evitar erro de ponto flutuante. A tela
 * fala reais; o contrato fala centavos. Estas duas funções fazem a ponte.
 */

/** Formata centavos como moeda brasileira: 20000 → "R$ 200,00". */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/**
 * Converte uma entrada em reais (texto do campo) para centavos inteiros.
 * Aceita "200", "200,50", "1.234,56". Devolve `null` quando não é um valor
 * positivo válido, para a tela não enviar lixo.
 */
export function parseReaisToCents(input: string): number | null {
  const normalized = input
    .trim()
    .replace(/\s|R\$/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  if (normalized === "") return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}
