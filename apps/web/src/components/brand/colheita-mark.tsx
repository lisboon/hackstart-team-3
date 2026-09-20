/**
 * O arco aberto é o C de Colheita e o gesto de recolher; as barras subindo
 * dentro dele são o que foi colhido. Em `currentColor` para herdar a cor de
 * quem usa, inclusive quando vira marca d'água.
 *
 * Sem tamanho próprio: um `size-` embutido sobreviveria ao `cn` quando quem
 * chama passa `h-full w-full`, e a marca d'água sairia com 24px.
 */
export function ColheitaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden
      className={className}
      fill="none"
    >
      <path
        d="M35 11.5A17.5 17.5 0 1 0 35 36.5"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <rect x="14" y="25.5" width="5" height="6.5" rx="2.5" fill="currentColor" />
      <rect x="21.5" y="20.5" width="5" height="11.5" rx="2.5" fill="currentColor" />
      <rect x="29.5" y="16" width="5" height="16" rx="2.5" fill="currentColor" />
    </svg>
  );
}
