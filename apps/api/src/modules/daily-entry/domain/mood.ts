/**
 * Cinco níveis, 1 = pior. Vive fora da entidade porque o validator também
 * precisa deles: importar da entidade criaria um ciclo, e os decorators
 * seriam avaliados com os limites ainda indefinidos.
 */
export const LOWEST_MOOD = 1;
export const HIGHEST_MOOD = 5;
