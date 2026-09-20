"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/auth/use-auth";
import { fetchUnitIndicators } from "@/services/organization/organization-service";
import type { UnitIndicators } from "@/schemas/organization";

type ManagerData = {
  data: UnitIndicators | null;
  loading: boolean;
  error: string;
};

const Context = createContext<ManagerData>({
  data: null,
  loading: true,
  error: "",
});

/**
 * O gráfico, os cartões e o sino leem os mesmos indicadores. Buscar uma vez e
 * repartir evita três chamadas iguais — e evita que o sino avise sobre um
 * número diferente do que a tela mostra.
 */
export function ManagerDataProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [state, setState] = useState<ManagerData>({
    data: null,
    loading: true,
    error: "",
  });

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();
    fetchUnitIndicators(token, controller.signal)
      .then((data) => setState({ data, loading: false, error: "" }))
      .catch((cause) => {
        if (controller.signal.aborted) return;
        setState({
          data: null,
          loading: false,
          error:
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar o painel.",
        });
      });

    return () => controller.abort();
  }, [token]);

  return <Context.Provider value={state}>{children}</Context.Provider>;
}

export function useManagerData() {
  return useContext(Context);
}
