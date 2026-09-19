/**
 * Histórico sintético da demonstração (Anexo V 4.4).
 *
 * Nada aqui é dado de pessoa real: os nomes são inventados e os e-mails usam
 * `demo.invalid`, domínio reservado pela RFC 2606 que nunca resolve. Estas
 * pessoas existem só para o agregado da unidade ter massa; elas não têm senha
 * utilizável e não conseguem entrar no app.
 *
 * Os valores são fixos, nunca sorteados: o mesmo seed produz sempre os mesmos
 * números, que é o que permite conferir o painel contra a conta feita à mão.
 */

export type DemoSituation =
  | 'SURPLUS'
  | 'BREAK_EVEN'
  | 'SLIGHT_SHORTFALL'
  | 'SEVERE_SHORTFALL';

export type DemoPerson = {
  name: string;
  /** Situação declarada, do mês mais antigo para o mês corrente. */
  situations: readonly DemoSituation[];
  /** Humor por dia, do dia mais antigo para o mais recente. */
  moods: readonly number[];
  /** Quantas peças da trilha esta pessoa já respondeu. */
  answeredPieces: number;
};

export const DEMO_EMAIL_DOMAIN = 'demo.invalid';

/**
 * A pessoa do pitch precisa de seis meses, não três: a trajetória só compara
 * quando existem os dois trimestres. Com três, a tela mostra uma barra só e
 * convida a declarar — que é o estado de quem acabou de chegar, não o de quem
 * vai ilustrar a evolução no palco.
 *
 * O dia de hoje fica de fora de propósito, para a apresentação começar na
 * pergunta de humor e o toque acontecer ao vivo.
 */
export const PITCH_HISTORY: Omit<DemoPerson, 'name'> = {
  situations: [
    'SEVERE_SHORTFALL',
    'SLIGHT_SHORTFALL',
    'SEVERE_SHORTFALL',
    'SLIGHT_SHORTFALL',
    'BREAK_EVEN',
    'SURPLUS',
  ],
  moods: [2, 3, 2, 4, 3, 4, 3, 5, 4, 4, 3, 5],
  answeredPieces: 2,
};

/**
 * Unidade do pitch: com a pessoa do seed somam seis pessoas com histórico,
 * acima do mínimo de cinco que libera o agregado.
 */
export const UNIT_A_COHORT: readonly DemoPerson[] = [
  {
    name: 'Joana Ribeiro',
    situations: ['SLIGHT_SHORTFALL', 'BREAK_EVEN', 'BREAK_EVEN'],
    moods: [3, 4, 4, 3, 4, 5, 4, 4],
    answeredPieces: 3,
  },
  {
    name: 'Marcos Tavares',
    situations: ['SEVERE_SHORTFALL', 'SEVERE_SHORTFALL', 'SLIGHT_SHORTFALL'],
    moods: [2, 2, 3, 2, 3, 3, 2, 3],
    answeredPieces: 1,
  },
  {
    name: 'Cleide Nunes',
    situations: ['BREAK_EVEN', 'SURPLUS', 'SURPLUS'],
    moods: [4, 5, 4, 5, 5, 4, 5, 5],
    answeredPieces: 4,
  },
  {
    name: 'Ivo Salgado',
    situations: ['SLIGHT_SHORTFALL', 'SLIGHT_SHORTFALL', 'BREAK_EVEN'],
    moods: [3, 3, 2, 3, 4, 3, 4, 3],
    answeredPieces: 2,
  },
  {
    name: 'Rita Boaventura',
    situations: ['BREAK_EVEN', 'BREAK_EVEN', 'SURPLUS'],
    moods: [4, 4, 5, 4, 4, 5, 4, 4],
    answeredPieces: 2,
  },
];

/**
 * Unidade vizinha com quatro pessoas: é o que demonstra a supressão ao vivo.
 * Abaixo de cinco no recorte, o painel diz que não há dado suficiente em vez de
 * mostrar número — agregar grupo pequeno não anonimiza ninguém.
 */
export const UNIT_B = {
  name: 'Unidade Sul (demonstração)',
  slug: 'unidade-sul-demo',
  cohort: [
    {
      name: 'Bento Alencar',
      situations: ['SEVERE_SHORTFALL', 'SLIGHT_SHORTFALL', 'SLIGHT_SHORTFALL'],
      moods: [2, 3, 3, 2, 3, 4, 3, 3],
      answeredPieces: 1,
    },
    {
      name: 'Dalva Peixoto',
      situations: ['BREAK_EVEN', 'BREAK_EVEN', 'SURPLUS'],
      moods: [4, 4, 4, 5, 4, 4, 5, 4],
      answeredPieces: 2,
    },
    {
      name: 'Otávio Lins',
      situations: ['SLIGHT_SHORTFALL', 'BREAK_EVEN', 'BREAK_EVEN'],
      moods: [3, 3, 4, 3, 4, 3, 4, 4],
      answeredPieces: 3,
    },
    {
      name: 'Neusa Fontes',
      situations: ['SURPLUS', 'SURPLUS', 'BREAK_EVEN'],
      moods: [5, 4, 5, 4, 5, 5, 4, 4],
      answeredPieces: 2,
    },
  ] as const satisfies readonly DemoPerson[],
};

/** `Joana Ribeiro` viraria `joana.ribeiro@demo.invalid`. */
export function demoEmail(name: string): string {
  const local = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.');
  return `${local}@${DEMO_EMAIL_DOMAIN}`;
}
