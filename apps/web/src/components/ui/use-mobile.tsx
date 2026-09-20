import * as React from "react";

const MOBILE_BREAKPOINT = 768;

function subscribe(onChange: () => void) {
  const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * A versão do registro do shadcn chama `setState` dentro de um efeito, o que a
 * regra `react-hooks/set-state-in-effect` reprova aqui. `useSyncExternalStore`
 * é a ferramenta feita para isto: lê estado de fora do React sem render em
 * cascata, e o retorno do servidor evita divergência na hidratação.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.innerWidth < MOBILE_BREAKPOINT,
    () => false,
  );
}
