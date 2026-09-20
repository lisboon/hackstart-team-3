# Uso de IA, limitações e riscos

Declaração exigida pelo Anexo V (itens 5.III, 5.IV, 5.V, 7.V, 7.VI e 7.VIII).

## Esta versão não usa inteligência artificial

**Nenhuma tela do produto chama um modelo. Nenhum texto exibido ao usuário é gerado.**

O repositório contém `apps/ai` e um componente `AiPanel`, ambos herdados do template `hackathon-star-nest`. Nenhum dos dois está ligado à jornada: `daily-journey.tsx` não os importa e nenhuma rota os renderiza. Estão no repositório como base para trabalho futuro, não como parte da entrega.

Onde alguém poderia esperar IA, há duas coisas determinísticas:

- **Regra no backend.** A trajetória, o resumo pessoal e os indicadores da unidade saem de cálculo em código, auditável linha a linha. O mesmo dado de entrada produz sempre o mesmo número.
- **Catálogo escrito por pessoa.** As peças do COOPS têm texto, opções e consequências fixos, revisados antes de entrar no banco. Cada peça carrega `sourceUrl` e a tela credita a origem (Anexo V 5.V).

O pitch não afirma uso de IA. Alegar um recurso que o código não tem é verificável em trinta segundos por quem abre o repositório.

## Por que não

Conteúdo sobre dinheiro e sofrimento precisa ser auditável antes de ser exibido. Texto gerado na hora não passa por revisão, e o custo de um erro aqui não é um parágrafo ruim: é uma orientação financeira equivocada para alguém que já está apertado, ou uma frase desastrada para alguém que acabou de declarar que não está bem.

Com catálogo curado sabemos exatamente o que cada pessoa vai ler. Com geração, não.

## Se e como a IA entraria depois

Escopo já delimitado, registrado nas issues #16 e #17:

**Poderia:** tornar compreensível um conteúdo que já foi aprovado, citando a fonte.

**Não poderia:**
- diagnosticar qualquer condição, financeira ou emocional
- investigar o motivo de um sentimento — isso é papel de profissional, não de chatbot
- recomendar produto financeiro
- gerar o número. O backend calcula; a IA, no máximo, traduz

A razão da terceira e da quarta linha: há dependência emocional patológica documentada em chatbots, e um chatbot não tem dever de sigilo nem treinamento clínico.

## Dados que o produto usa

| Dado | Origem | Quem vê |
|---|---|---|
| Situação do mês | a própria pessoa declara | só ela |
| Humor do dia | a própria pessoa declara | só ela |
| Resposta da peça | a própria pessoa escolhe | só ela |
| Indicadores da unidade | agregação dos acima | gestor, sem individualizar |

**Não há acesso a movimentação bancária, extrato, saldo ou histórico de transações.** Tudo é autodeclarado — a situação do mês, o humor do dia e, na meta de guarda, o valor-alvo que a própria pessoa define (#71). O produto não prescreve nem verifica esse valor contra saldo: quem escolhe é a pessoa. Essa não é uma limitação técnica que pretendemos remover: é a escolha que torna o produto aceitável dentro de uma empresa.

Os gateways de `SelfReport` e `DailyEntry` exigem `userId` e `companyId` juntos em toda assinatura, e nenhum dos dois expõe um `findById` — não existe caminho no código para ler o dado de bem-estar de alguém sem saber de antemão de quem é e de que empresa, nem para um `ADMIN`. `User` tem `findById`, usado pela autenticação, e um `findByIdInCompany` separado para quando o acesso vem de fora da própria sessão.

Na demonstração, todos os dados são **fictícios** (Anexo V 4.4). O aviso na tela faz parte da issue #18 e ainda não está implementado.

## O que o produto não faz

**Não diagnostica e não substitui atendimento profissional** (Anexo V 5.III). O aviso está fixo no rodapé do app, em toda rota, junto do CVV 188 — gratuito, 24 horas, a um toque de qualquer tela.

## Limitações e riscos, declarados

**Engajamento é o maior risco.** Apps de saúde mental retêm cerca de 3,3% dos usuários em 30 dias. Um produto de hábito diário que ninguém abre no dia 31 não resolve nada, e nenhuma decisão de design elimina esse risco — só o reduz.

**A categoria já existe.** Zogo opera educação financeira gamificada em mais de 250 instituições. Não alegamos ineditismo. O que propomos de diferente é o recorte: método público do próprio Sicredi, dentro da empresa, sem ponto trocável e sem exposição individual ao gestor.

**Educação financeira isolada explica pouco.** A meta-análise de Fernandes, Lynch e Netemeyer (*Management Science*, 2014) mostra que intervenções de educação financeira explicam cerca de 0,1% da variância em comportamento financeiro. É por isso que o produto não é um curso: é decisão repetida com consequência visível, no momento em que a pessoa já está pensando no assunto.

**Autodeclaração é frágil.** A pessoa pode declarar errado, por engano ou por constrangimento. Open Finance com consentimento explícito é evolução possível, não promessa desta entrega.

**Se a renda não cobre o básico, nem meta nem conteúdo resolvem.** O produto não tem o que oferecer a quem está nessa situação além do encaminhamento ao assessor. Dizer o contrário seria culpabilizar quem não tem escolha.

**Não prometemos conformidade com a NR-1.** A norma passou a exigir risco psicossocial no GRO desde 26/05/2026. O painel agregado endereça parte desse risco e produz evidência para o programa da empresa; declarar conformidade é atribuição do SESMT, não de um aplicativo.

**Gamificação tem risco próprio, e não é o vício.** O risco real é a aversão à perda — perder uma sequência dói cerca de duas vezes mais do que ganhá-la agrada (Kahneman). Por isso o contador é cumulativo, com dia protegido, e não há moeda, liga, ranking nem prêmio material: zerar a sequência de alguém sob estresse financeiro o faria abandonar exatamente quando mais precisa.
