"use client";

import { useProgress } from "@/hooks/progress/use-progress";
import { MonthHistogram } from "./month-histogram";

/**
 * A ponte entre o hook e o desenho, para o histograma continuar sem saber de
 * transporte — é o que `tests/boundaries.test.mjs` cobra.
 *
 * Sem o mês não há tela vazia de erro: o histograma é um complemento da tela
 * Progresso, e falhar em carregá-lo não pode derrubar as metas de guarda.
 */
export function MonthProgress({
  token,
  onUnauthorized,
}: {
  token: string;
  onUnauthorized: () => void;
}) {
  const { progress, loading } = useProgress(token, onUnauthorized);

  if (loading || !progress) return null;
  return <MonthHistogram progress={progress} />;
}
