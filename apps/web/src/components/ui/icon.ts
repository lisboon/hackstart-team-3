/**
 * Espessura de traço dos ícones, conforme o manual de identidade do Sicredi.
 *
 * Eles constroem sobre grid de 104px com traço de 6,5px — 6,25% do tamanho.
 * O `lucide` desenha em viewBox de 24 e assume `strokeWidth: 2`, que dá 8,33%
 * e sai visivelmente mais pesado que o sistema deles.
 *
 * 24 × 0,0625 = 1,5.
 */
export const ICON_STROKE = 1.5;
