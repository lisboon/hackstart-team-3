/**
 * Cinco níveis, 1 = pior. Vive fora da entidade porque o validator também
 * precisa deles: importar da entidade criaria um ciclo, e os decorators
 * seriam avaliados com os limites ainda indefinidos.
 */
export const LOWEST_MOOD = 1;
export const HIGHEST_MOOD = 5;

/**
 * O ponto médio da escala. Usado só como humor automático quando a colheita
 * abre o dia sem a pessoa ter declarado como está — nunca conta como
 * declaração, e é sobrescrito pelo humor real (ver `moodDeclared`).
 */
export const NEUTRAL_MOOD = 3;
