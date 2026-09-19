/**
 * Peças do método COOPS, do programa Cooperação na Ponta do Lápis, do Sicredi.
 *
 * As cinco etapas — Conscientizar, Observar, Organizar, Preparar, Sustentar —
 * e a base em psicologia econômica são do programa. Os textos abaixo são
 * EXEMPLOS escritos para a demonstração: não reproduzem material do Sicredi
 * Aprende, e `sourceUrl` aponta para o programa real.
 */
const SOURCE = 'https://www.sicredi.com.br/site/napontadolapis/';

export const CONTENT_PIECES = [
  {
    stage: 'CONSCIENTIZAR',
    orderInStage: 1,
    title: 'Dinheiro também é emoção',
    body: 'O método do Cooperação na Ponta do Lápis parte de uma ideia simples: decisão de dinheiro não é só conta. Envolve hábito, cansaço e o que a gente sente na hora. Reparar nisso é o primeiro passo — não para se culpar, mas para enxergar o que estava no automático.',
    prompt: 'Você abre o app do banco depois de um dia ruim e vê o saldo menor do que esperava. O que costuma acontecer?',
    options: [
      { label: 'Fecho e deixo para depois', outcome: 'É o mais comum, e não tem nada de errado. Reparar que você fez isso já é o primeiro passo do método.', demonstratesComprehension: true },
      { label: 'Nunca me sinto assim com dinheiro', outcome: 'Acontece com quase todo mundo. O programa do Sicredi parte justamente daí: emoção faz parte da decisão.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'OBSERVAR',
    orderInStage: 1,
    title: 'Para onde o dinheiro foi',
    body: 'Observar é olhar sem julgar. Antes de cortar qualquer coisa, o método pede só uma coisa: saber para onde o dinheiro está indo. Sem isso, qualquer plano é chute — e plano que é chute não sobrevive ao primeiro imprevisto.',
    prompt: 'Você quer entender seu mês. Por onde começar?',
    options: [
      { label: 'Olhar o que já saiu no mês passado', outcome: 'É por aí. O que já aconteceu é o dado mais confiável que você tem sobre você mesmo.', demonstratesComprehension: true },
      { label: 'Fazer um orçamento do zero', outcome: 'Orçamento sem olhar o passado vira lista de boas intenções. O método pede observar antes de organizar.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'ORGANIZAR',
    orderInStage: 1,
    title: 'A conta que vence primeiro',
    body: 'Organizar não é cortar tudo. É colocar na ordem: o que vence antes, o que custa mais caro se atrasar, o que dá para negociar. Juros de cheque especial e de rotativo do cartão são os que crescem mais rápido — são eles que costumam comer o mês seguinte.',
    prompt: 'Sobrou um pouco e você tem duas dívidas. Qual pagar primeiro?',
    options: [
      { label: 'A que cobra mais juros', outcome: 'Certo. É a que cresce mais rápido, então é a que rouba mais do mês que vem.', demonstratesComprehension: true },
      { label: 'A menor, para tirar da lista', outcome: 'Dá alívio, e isso conta. Mas a de juro maior continua crescendo enquanto isso.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'PREPARAR',
    orderInStage: 1,
    title: 'O imprevisto não avisa',
    body: 'Preparar é ter alguma folga antes de precisar. Não é sobre valor alto — é sobre existir. Quem tem qualquer reserva resolve um imprevisto sem virar dívida nova; quem não tem, transforma um problema de uma vez em uma conta de muitos meses.',
    prompt: 'Sobraram R$ 50 este mês. O que fazer?',
    options: [
      { label: 'Guardar, mesmo sendo pouco', outcome: 'É o que o método pede. O valor importa menos que o hábito existir quando o imprevisto chegar.', demonstratesComprehension: true },
      { label: 'Deixar na conta, R$ 50 não muda nada', outcome: 'Costuma sumir até o meio do mês. E quando o imprevisto vem, R$ 50 seriam R$ 50 a menos de dívida.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'SUSTENTAR',
    orderInStage: 1,
    title: 'O mês que não fechou',
    body: 'Sustentar é continuar depois que dá errado. Todo plano financeiro encontra um mês ruim — e o que decide não é o mês ruim, é o que vem depois dele. Recomeçar não apaga o que você já construiu.',
    prompt: 'Você vinha guardando todo mês e este mês não deu. E agora?',
    options: [
      { label: 'Retomo no mês que vem', outcome: 'É exatamente isso. Um mês fora não desfaz os anteriores — a continuidade é o que sustenta.', demonstratesComprehension: true },
      { label: 'Perdi o progresso, melhor recomeçar do zero', outcome: 'Você não perdeu nada. O que já foi guardado continua lá, e o hábito também.', demonstratesComprehension: false },
    ],
  },
] as const;

export { SOURCE as CONTENT_SOURCE_URL };
