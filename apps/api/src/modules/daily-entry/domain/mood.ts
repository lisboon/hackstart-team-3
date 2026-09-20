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

/**
 * Tamanho máximo da nota opcional que acompanha o humor (#91). O texto é livre
 * e pessoal; o limite existe só para caber num campo e proteger o banco de
 * envios abusivos, não para restringir o desabafo.
 */
export const MAX_MOOD_NOTE_LENGTH = 500;
