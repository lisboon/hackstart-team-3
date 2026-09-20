/**
 * Peças do método COOPS, do programa Cooperação na Ponta do Lápis, do Sicredi.
 *
 * As cinco etapas — Conscientizar, Observar, Organizar, Preparar, Sustentar —
 * e a base em psicologia econômica são do programa. Os textos abaixo são
 * EXEMPLOS escritos para a demonstração: não reproduzem material do Sicredi
 * Aprende, e `sourceUrl` aponta para o programa real.
 *
 * Seis peças por etapa, trinta ao todo: é um mês de trilha, e é o número que
 * `docs/telas.html` e `docs/contratos.md` sempre mostraram. Com uma peça por
 * etapa a tela dizia "1 de 1" cinco vezes, e o produto cuja tese é caminho
 * diário não tinha caminho.
 *
 * Regras que valem para todo texto daqui:
 *
 * - **Nenhuma peça prescreve valor em dinheiro.** O cenário pode citar um
 *   valor ("sobraram R$ 50"), porque é a situação; a consequência nunca diz
 *   quanto guardar. Quem define é a pessoa.
 * - **Escolher diferente não é erro.** `demonstratesComprehension` alimenta o
 *   indicador de compreensão, e nunca vira vermelho na tela. Toda opção tem
 *   consequência escrita com respeito, inclusive a que contraria o método.
 * - **Nada diagnostica nem investiga sentimento** (regra 7 do CLAUDE.md).
 * - Se a renda não cobre o básico, nenhuma peça finge que organizar resolve —
 *   várias delas encaminham para conversar com alguém.
 */
const SOURCE = 'https://www.sicredi.com.br/site/napontadolapis/';

export const CONTENT_PIECES = [
  // ─── CONSCIENTIZAR ── reparar no que estava no automático ───────────────
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
    stage: 'CONSCIENTIZAR',
    orderInStage: 2,
    title: 'O gasto que não dói',
    body: 'Gasto pequeno e repetido some do radar porque cada um deles parece irrelevante. O método não pede que você corte nada agora: pede que você repare. Um valor que se repete vinte vezes no mês deixou de ser pequeno faz tempo.',
    prompt: 'Qual desses costuma passar mais despercebido no seu mês?',
    options: [
      { label: 'Os pequenos do dia a dia', outcome: 'É quase sempre por aí. Nenhum deles dói sozinho — e é exatamente isso que faz eles não aparecerem na conta que a gente faz de cabeça.', demonstratesComprehension: true },
      { label: 'As contas grandes', outcome: 'Essas a gente costuma ver chegando, porque têm data e boleto. O que escapa é o que não tem aviso.', demonstratesComprehension: false },
      { label: 'Nada passa despercebido', outcome: 'Se for assim, você já está adiante de boa parte do caminho. Vale conferir uma semana só para ter certeza.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'CONSCIENTIZAR',
    orderInStage: 3,
    title: 'Comparar cansa',
    body: 'Parte do que a gente gasta não vem do que a gente quer, mas do que acha que devia ter. O método chama atenção para isso porque é um gasto que não aparece em planilha nenhuma — e é dos que mais pesam.',
    prompt: 'Um colega trocou de carro. Você se pega pensando no seu. O que ajuda mais?',
    options: [
      { label: 'Lembrar que não sei a conta dele', outcome: 'Ajuda mesmo. Prestação é privada, e a foto que a gente vê nunca vem com o extrato junto.', demonstratesComprehension: true },
      { label: 'Correr atrás para não ficar para trás', outcome: 'É uma reação honesta, e comum. Só vale lembrar que você estaria correndo atrás de uma conta que não conhece.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'CONSCIENTIZAR',
    orderInStage: 4,
    title: 'Quem decide o seu mês',
    body: 'Boa parte das decisões de dinheiro já vem decidida: débito automático, assinatura que renova sozinha, parcela que continua. Conscientizar é perceber quantas escolhas do mês foram feitas por você há seis meses, e não hoje.',
    prompt: 'Você olha a fatura e encontra uma assinatura que não usa há meses. E aí?',
    options: [
      { label: 'Reparo e decido depois com calma', outcome: 'Reparar já é o passo desta etapa. Decidir vem na hora de organizar, e não precisa ser agora.', demonstratesComprehension: true },
      { label: 'Cancelo tudo que não uso, na hora', outcome: 'Também funciona, e dá alívio imediato. Só tome cuidado para a decisão rápida não virar arrependimento no mês seguinte.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'CONSCIENTIZAR',
    orderInStage: 5,
    title: 'O mês que já começou devendo',
    body: 'Quando a renda não cobre o básico, nenhuma técnica de planejamento resolve — e dizer o contrário seria culpar quem não tem escolha. O método serve para enxergar a situação com clareza, e clareza às vezes significa reconhecer que é hora de pedir ajuda.',
    prompt: 'O salário entra e já sai quase todo em conta atrasada. O que faz mais sentido?',
    options: [
      { label: 'Procurar alguém para conversar sobre isso', outcome: 'É a saída mais realista. Assessor da agência, RH, canal confidencial — existe gente cuja função é ajudar exatamente com isso.', demonstratesComprehension: true },
      { label: 'Apertar mais um pouco e resolver sozinho', outcome: 'Dá para segurar por um tempo, e muita gente segura. Mas aperto que já não cabe costuma virar dívida nova, não sobra.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'CONSCIENTIZAR',
    orderInStage: 6,
    title: 'Falar sobre dinheiro',
    body: 'Dinheiro é dos assuntos mais silenciosos que existem, inclusive dentro de casa. O método trata isso como parte do problema: o que não se conversa não se organiza, e quem decide sozinho carrega sozinho.',
    prompt: 'Uma conta grande vai chegar e você ainda não falou com ninguém de casa. O que ajuda?',
    options: [
      { label: 'Contar antes de a conta chegar', outcome: 'Antes é sempre mais fácil que depois. A conversa difícil fica menor quando não vem junto com o susto.', demonstratesComprehension: true },
      { label: 'Resolver e contar depois', outcome: 'É uma forma de proteger quem você gosta, e vem de um bom lugar. Só costuma deixar o peso todo de um lado só.', demonstratesComprehension: false },
    ],
  },

  // ─── OBSERVAR ── olhar sem julgar, antes de mexer ───────────────────────
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
    stage: 'OBSERVAR',
    orderInStage: 2,
    title: 'Fixo, variável e o resto',
    body: 'Nem todo gasto se comporta igual. Aluguel chega igual todo mês; mercado varia; o imprevisto nem avisa. Separar por comportamento, e não por categoria, é o que mostra onde existe manobra de verdade.',
    prompt: 'Você quer folga no mês. Onde costuma existir espaço para mexer?',
    options: [
      { label: 'Nos gastos que variam', outcome: 'Exato. É neles que a escolha ainda está na sua mão este mês — o fixo já foi decidido antes.', demonstratesComprehension: true },
      { label: 'Nos gastos fixos', outcome: 'Dá para mexer, mas quase nunca este mês: fixo costuma exigir renegociar contrato, e isso leva tempo.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'OBSERVAR',
    orderInStage: 3,
    title: 'Uma semana já mostra',
    body: 'Anotar tudo por um mês é o conselho mais dado e o menos seguido. O método aceita menos: uma semana honesta já revela o padrão, e padrão é o que interessa. Anotação que você não mantém não serve para nada.',
    prompt: 'Você nunca conseguiu anotar gastos por muito tempo. O que tentar?',
    options: [
      { label: 'Anotar sete dias e olhar o que apareceu', outcome: 'É o suficiente para ver o padrão. E sete dias você termina, o que já é mais do que um mês abandonado no dia dez.', demonstratesComprehension: true },
      { label: 'Tentar o mês inteiro mais uma vez', outcome: 'Se funcionar, ótimo. Mas se já não funcionou antes, talvez o problema seja o tamanho da tarefa, não a sua disciplina.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'OBSERVAR',
    orderInStage: 4,
    title: 'O extrato não julga',
    body: 'Olhar o próprio extrato costuma dar vergonha, e a vergonha faz a gente fechar o app. O método insiste que esse é o momento mais importante: o extrato não é uma nota, é um mapa. Mapa nenhum acusa quem o lê.',
    prompt: 'Você abre o extrato e encontra um gasto de que se arrepende. O que fazer com isso?',
    options: [
      { label: 'Anotar e seguir olhando o resto', outcome: 'É o jeito de a leitura terminar. Parar no primeiro arrependimento é como fechar o mapa na primeira curva.', demonstratesComprehension: true },
      { label: 'Fechar, já entendi o problema', outcome: 'Entendeu um. Os que vêm depois dele é que costumam explicar o mês inteiro.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'OBSERVAR',
    orderInStage: 5,
    title: 'O mês não é igual ao outro',
    body: 'Material escolar em janeiro, IPVA, aniversário, Natal. Gasto sazonal é o que mais desmonta plano, porque a gente planeja com o mês comum e é surpreendido pelo mês diferente. Observar inclui olhar o ano, não só o mês.',
    prompt: 'Qual desses costuma pegar as pessoas de surpresa todo ano?',
    options: [
      { label: 'O que acontece todo ano na mesma época', outcome: 'É o paradoxo: justamente o previsível é o que surpreende, porque a gente não conta com ele no mês comum.', demonstratesComprehension: true },
      { label: 'O que ninguém tinha como prever', outcome: 'Esse existe, e é para ele que serve a reserva. Mas ele costuma pesar menos que o esquecido.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'OBSERVAR',
    orderInStage: 6,
    title: 'Quanto custa parcelar',
    body: 'Parcela "sem juros" muda o preço da coisa: ela troca um valor à vista por um compromisso que ocupa os próximos meses. Observar é ver quanto do mês que vem já está vendido antes de ele começar.',
    prompt: 'Você soma as parcelas que já tem e descobre que elas ocupam boa parte do próximo salário. O que isso diz?',
    options: [
      { label: 'Que o mês que vem tem menos espaço do que parece', outcome: 'É isso. Parcela não é gasto futuro, é renda que já foi comprometida — e ela não aparece no saldo de hoje.', demonstratesComprehension: true },
      { label: 'Que está tudo bem, é sem juros', outcome: 'Sem juros é melhor que com juros, sem dúvida. O que continua igual é que o dinheiro do mês que vem já tem dono.', demonstratesComprehension: false },
    ],
  },

  // ─── ORGANIZAR ── colocar na ordem, com critério ────────────────────────
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
    stage: 'ORGANIZAR',
    orderInStage: 2,
    title: 'Renegociar não é fracasso',
    body: 'Muita gente evita ligar para renegociar porque soa como admitir derrota. Na prática é o contrário: credor prefere receber menos e combinado a não receber. Quem chega antes do atraso costuma conseguir condição melhor.',
    prompt: 'Você vê que não vai conseguir pagar uma parcela no mês que vem. Quando procurar?',
    options: [
      { label: 'Agora, antes de atrasar', outcome: 'É o melhor momento que existe. Antes do atraso você ainda está negociando, e não pedindo desculpa.', demonstratesComprehension: true },
      { label: 'Depois que atrasar, quando eles cobrarem', outcome: 'Acontece muito, e não é o fim do mundo. Só que aí o valor já cresceu e a conversa começa mais difícil.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'ORGANIZAR',
    orderInStage: 3,
    title: 'Trocar dívida cara por barata',
    body: 'Nem toda dívida custa igual. Rotativo do cartão e cheque especial estão entre os juros mais altos que existem; crédito consignado ou empréstimo negociado costumam custar bem menos. Organizar às vezes é trocar de dívida, não quitá-la.',
    prompt: 'Você está no rotativo do cartão há três meses. O que costuma ajudar?',
    options: [
      { label: 'Procurar uma linha mais barata para trocar', outcome: 'É uma das saídas que o método aponta. Continua sendo dívida — mas dívida que cresce mais devagar dá tempo de respirar.', demonstratesComprehension: true },
      { label: 'Pagar o mínimo até melhorar', outcome: 'Segura o nome limpo, e isso vale. Mas o mínimo do rotativo costuma não alcançar nem os juros do mês.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'ORGANIZAR',
    orderInStage: 4,
    title: 'Data também organiza',
    body: 'Conta que vence antes do salário obriga a usar o dinheiro do mês anterior — ou o limite. Juntar os vencimentos logo depois da entrada é um ajuste que não custa nada e tira pressão do mês inteiro.',
    prompt: 'Metade das suas contas vence antes do dia do pagamento. O que dá para fazer?',
    options: [
      { label: 'Pedir para mudar a data de vencimento', outcome: 'É gratuito na maioria dos casos e quase ninguém pede. Um telefonema muda o mês inteiro de lugar.', demonstratesComprehension: true },
      { label: 'Usar o limite até o salário cair', outcome: 'Resolve o dia, e é o que a maioria faz. Só que o limite cobra por isso todo mês, e a data continua igual.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'ORGANIZAR',
    orderInStage: 5,
    title: 'Cortar o que não dói',
    body: 'Plano que começa cortando o que a pessoa mais gosta dura duas semanas. O método sugere o contrário: comece pelo que você nem vai sentir falta. Corte que não dói é corte que sobrevive.',
    prompt: 'Você precisa de folga no orçamento. Por onde começar?',
    options: [
      { label: 'Pelo que eu nem lembrava que pagava', outcome: 'É o corte que dura. O que não faz falta hoje não vai fazer falta no mês que vem.', demonstratesComprehension: true },
      { label: 'Pelo que custa mais caro', outcome: 'A conta faz sentido no papel. Só que costuma ser justamente o que segura a pessoa no plano — e plano abandonado não economiza nada.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'ORGANIZAR',
    orderInStage: 6,
    title: 'Emprestar o nome',
    body: 'Ser fiador ou passar o cartão para alguém transfere o risco inteiro e nenhum controle. Organizar as próprias contas inclui saber quais compromissos são seus de fato — e quais você assumiu por outra pessoa.',
    prompt: 'Um parente pede o seu nome para financiar algo. O que pesar?',
    options: [
      { label: 'Que a conta passa a ser minha se ele não pagar', outcome: 'É exatamente assim que funciona, e é a parte que costuma não ser dita na hora do pedido.', demonstratesComprehension: true },
      { label: 'Que é dele, eu só empresto o nome', outcome: 'É o que parece, e é dito com boa intenção. Mas quem o banco procura depois é quem assinou.', demonstratesComprehension: false },
    ],
  },

  // ─── PREPARAR ── ter folga antes de precisar ────────────────────────────
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
    stage: 'PREPARAR',
    orderInStage: 2,
    title: 'Guardar antes de gastar',
    body: 'Guardar o que sobra quase nunca funciona, porque raramente sobra. O método inverte a ordem: separar assim que o dinheiro entra, mesmo que pouco, e viver com o resto. O que sai primeiro é o que sobrevive ao mês.',
    prompt: 'Você quer começar a guardar. Qual ordem funciona melhor?',
    options: [
      { label: 'Separar quando o salário entra', outcome: 'É a inversão que o método propõe. O que é separado no dia um não disputa com o mês.', demonstratesComprehension: true },
      { label: 'Guardar o que sobrar no fim do mês', outcome: 'É a ordem mais natural, e é por isso que quase todo mundo tenta assim primeiro. O problema é que sobra é o que resta depois de tudo.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'PREPARAR',
    orderInStage: 3,
    title: 'Reserva não é investimento',
    body: 'Reserva de emergência tem uma função só: estar disponível no dia em que precisar. Rendimento é secundário — se o dinheiro não sai rápido, ele não serve para emergência, por melhor que seja a aplicação.',
    prompt: 'Onde faz mais sentido deixar a reserva?',
    options: [
      { label: 'Em algo que eu consiga resgatar no mesmo dia', outcome: 'É o critério certo. Reserva presa numa aplicação boa não resolve o pneu que furou hoje.', demonstratesComprehension: true },
      { label: 'Onde render mais, mesmo demorando para sacar', outcome: 'Render mais é bom, e faz sentido para outros objetivos. Só que aí vira investimento, e a emergência continua sem cobertura.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'PREPARAR',
    orderInStage: 4,
    title: 'Objetivo com nome',
    body: 'Guardar "para o futuro" é abstrato demais para competir com o presente. O método sugere dar nome: conserto da moto, matrícula, viagem de fim de ano. Objetivo com nome resiste melhor à tentação do que objetivo genérico.',
    prompt: 'Você está guardando há dois meses e apareceu uma promoção tentadora. O que ajuda a decidir?',
    options: [
      { label: 'Lembrar para que aquele dinheiro tem nome', outcome: 'É a função do nome: ele transforma "dinheiro parado" em "a matrícula do meu filho", e aí a escolha fica mais clara.', demonstratesComprehension: true },
      { label: 'Aproveitar, depois eu reponho', outcome: 'Às vezes vale mesmo, e a decisão é sua. Só que "depois eu reponho" costuma ser a parte mais difícil do plano.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'PREPARAR',
    orderInStage: 5,
    title: 'Quando usar a reserva',
    body: 'Reserva existe para ser usada. Gastar a reserva num imprevisto de verdade não é fracasso — é ela cumprindo exatamente o que foi combinado. O que desmonta o plano é usá-la sem imprevisto, ou não usá-la e pegar dívida por orgulho.',
    prompt: 'A geladeira quebrou e você tem reserva. Qual é o caminho?',
    options: [
      { label: 'Usar a reserva e depois recompor', outcome: 'Foi para isto que ela existiu. Recompor é o passo seguinte, e ele é bem mais leve que pagar juros.', demonstratesComprehension: true },
      { label: 'Parcelar para não mexer na reserva', outcome: 'A vontade de preservar é compreensível. Mas nesse caso você paga juros para manter guardado o dinheiro que resolveria o problema hoje.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'PREPARAR',
    orderInStage: 6,
    title: 'A renda que varia',
    body: 'Quem ganha por produção, hora extra ou diária tem meses bons e meses magros. Preparar aqui é usar o mês bom para cobrir o mês magro, em vez de tratar o mês bom como o normal.',
    prompt: 'Este mês entrou bem mais que o normal, por causa das horas extras. O que fazer com a diferença?',
    options: [
      { label: 'Separar a diferença para os meses magros', outcome: 'É o que estabiliza a renda variável. O mês bom deixa de ser sorte e passa a ser o que segura o mês ruim.', demonstratesComprehension: true },
      { label: 'Aproveitar, foi trabalho a mais', outcome: 'Foi mesmo, e aproveitar um pouco é justo. O cuidado é o mês bom virar o padrão de gasto — porque ele não vai se repetir sempre.', demonstratesComprehension: false },
    ],
  },

  // ─── SUSTENTAR ── continuar depois que dá errado ────────────────────────
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
  {
    stage: 'SUSTENTAR',
    orderInStage: 2,
    title: 'Pequeno e constante',
    body: 'A pesquisa é chata nisso: quantia pequena e constante vence quantia grande e esporádica, porque a primeira vira hábito e a segunda depende de sobrar. Sustentar é escolher o valor que você consegue repetir no mês ruim.',
    prompt: 'Qual plano tem mais chance de durar um ano?',
    options: [
      { label: 'Um valor pequeno, todo mês', outcome: 'É o que dura. Plano bom não é o mais ambicioso, é o que você ainda consegue cumprir no pior mês do ano.', demonstratesComprehension: true },
      { label: 'Um valor alto, quando der', outcome: 'Rende mais quando acontece. O problema é a frequência: "quando der" costuma dar bem menos vezes do que a gente imagina.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'SUSTENTAR',
    orderInStage: 3,
    title: 'Revisar sem punir',
    body: 'Meta que não coube não é falha de caráter; é informação de que o tamanho estava errado. Sustentar inclui recalibrar sem transformar o ajuste em derrota — quem se pune costuma abandonar, e abandonar é o único jeito de perder de verdade.',
    prompt: 'Faz três meses que você não alcança a meta que definiu. O que fazer?',
    options: [
      { label: 'Diminuir a meta para um valor que cabe', outcome: 'É recalibrar, e é parte do método. Meta ajustada que você cumpre vale mais que meta bonita que você não alcança.', demonstratesComprehension: true },
      { label: 'Manter e me esforçar mais', outcome: 'A disposição conta. Só que três meses seguidos costumam estar dizendo algo sobre o tamanho da meta, não sobre o seu esforço.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'SUSTENTAR',
    orderInStage: 4,
    title: 'Comemorar o que deu certo',
    body: 'A gente registra o que falhou com muito mais cuidado do que o que funcionou. Sustentar depende de reconhecer o progresso: quem só enxerga o que faltou perde a razão para continuar.',
    prompt: 'Você fechou três meses seguidos no azul. O que fazer com isso?',
    options: [
      { label: 'Reparar e reconhecer que funcionou', outcome: 'Faz diferença de verdade. O que é reconhecido tende a se repetir — e você acabou de descobrir algo que funciona para você.', demonstratesComprehension: true },
      { label: 'Nada, é o mínimo esperado', outcome: 'É uma cobrança que muita gente faz consigo mesma. Mas três meses seguidos não são o mínimo: são um padrão que você construiu.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'SUSTENTAR',
    orderInStage: 5,
    title: 'Quando a conta não fecha mesmo',
    body: 'Há situações em que o problema não é organização: é renda insuficiente para o básico. O método não finge que planilha resolve isso. Sustentar, aqui, é saber que existe apoio e usá-lo — e que pedir ajuda é uma decisão financeira como qualquer outra.',
    prompt: 'Você organizou tudo e ainda assim não fecha. Qual o passo?',
    options: [
      { label: 'Buscar apoio: assessor, RH ou canal de escuta', outcome: 'É o passo certo, e não é desistir. Tem gente cuja função é ajudar com isso, e usar esse recurso é planejamento, não fracasso.', demonstratesComprehension: true },
      { label: 'Continuar tentando sozinho', outcome: 'Dá para insistir, e muita gente insiste por muito tempo. Só que quando a conta não fecha por renda, tentar mais forte costuma não mudar o resultado.', demonstratesComprehension: false },
    ],
  },
  {
    stage: 'SUSTENTAR',
    orderInStage: 6,
    title: 'O que fica depois',
    body: 'O fim da trilha não é ter um valor guardado: é ter mudado a forma de decidir. Quem passou pelas cinco etapas repara antes de gastar, olha antes de planejar e recomeça depois de errar. Isso continua valendo muito depois da última peça.',
    prompt: 'Você chegou ao fim da trilha. O que leva daqui?',
    options: [
      { label: 'Um jeito diferente de decidir', outcome: 'É o que o método persegue desde a primeira peça. Valor guardado varia com o mês; a forma de decidir fica.', demonstratesComprehension: true },
      { label: 'O que consegui guardar até agora', outcome: 'Também é seu, e é resultado de verdade. Só que ele oscila com o mês — e o que você aprendeu a fazer, não.', demonstratesComprehension: false },
    ],
  },
] as const;

export { SOURCE as CONTENT_SOURCE_URL };
