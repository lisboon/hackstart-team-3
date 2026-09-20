# Contratos da API

Formatos que o frontend consome. Swagger em `http://localhost:3001/api-docs` fora de produção.

## Regra que vale para todos os endpoints

**`userId` e `companyId` nunca vão no corpo, na query ou na rota.** Eles saem da sessão, no servidor. Mandar qualquer um deles é rejeitado com **422** — o `ValidationPipe` roda com `forbidNonWhitelisted`, então campo desconhecido é erro, não é ignorado em silêncio.

O mesmo vale para o mês: quem decide é o relógio do servidor.

Autenticação em toda rota sob `/me`: `Authorization: Bearer <accessToken>`.

## Erros

Forma única, de `HttpErrorResponseDto`:

```json
{ "statusCode": 401, "error": "Unauthorized", "message": "Invalid or expired token" }
```

Em 422, `message` é uma lista:

```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": [{ "field": "situation", "message": "Invalid situation" }]
}
```

| Código | Quando |
|---|---|
| 401 | sem token, token inválido ou sessão revogada — o frontend volta para o acesso |
| 403 | autenticado mas sem permissão — **mantém a sessão** |
| 422 | corpo inválido ou campo não previsto |
| 429 | limite de requisições |

---

## `POST /me/self-report`

Declara como o mês corrente fechou. Declarar de novo no mesmo mês **corrige** a declaração; não cria uma segunda.

**Request**

```json
{ "situation": "SURPLUS" }
```

`situation` aceita exatamente quatro valores, e nenhum deles é valor em dinheiro:

| Valor | Significado | Escala interna |
|---|---|---:|
| `SURPLUS` | sobrou | 3 |
| `BREAK_EVEN` | deu exatamente | 2 |
| `SLIGHT_SHORTFALL` | faltou um pouco | 1 |
| `SEVERE_SHORTFALL` | faltou bastante | 0 |

> A escala existe só para a média móvel da própria pessoa. **Não é score, não ranqueia ninguém, e não aparece na tela.**

**Response `201`**

```json
{ "referenceMonth": "2026-09-01T00:00:00.000Z", "situation": "SURPLUS" }
```

`referenceMonth` é sempre o primeiro dia do mês em UTC.

---

## `GET /me/summary`

Trajetória da pessoa **contra o próprio passado**. Nunca contra outras pessoas.

**Response `200`**

```json
{
  "currentMonth": "2026-09-01T00:00:00.000Z",
  "currentSituation": "SURPLUS",
  "recentAverage": 2.67,
  "previousAverage": 0.33,
  "declaredMonths": 6
}
```

| Campo | Tipo | Observação |
|---|---|---|
| `currentSituation` | enum ou **`null`** | `null` = ainda não declarou este mês. A tela pede a declaração |
| `recentAverage` | número ou **`null`** | média dos últimos 3 meses declarados |
| `previousAverage` | número ou **`null`** | média dos 3 meses anteriores a esses |
| `declaredMonths` | número | quantos meses da janela de 6 têm declaração |

### O tratamento do `null` é obrigatório na tela

**`null` não é zero.** Zero é `SEVERE_SHORTFALL` — o pior resultado possível. Apresentar ausência de declaração como pior resultado seria mentir para a pessoa justamente sobre o que ela não disse.

- `recentAverage` `null` → não desenhe gráfico, convide a declarar
- `previousAverage` `null` → não mostre comparação nem seta de tendência
- comparação só existe quando **os dois** são números

### Sobre a linguagem da tela

Comparar é o objetivo, mas **a tela nunca acusa**. `recentAverage` menor que `previousAverage` não é "você piorou" — é "esses meses foram mais apertados". A pessoa já sabe que o mês foi difícil; o produto não está ali para confirmar isso.

---

## `GET /me/today`

Chamado **ao abrir o app**. Diz o que a tela deve mostrar.

**Response `200`**

```json
{
  "entryDate": "2026-09-19T00:00:00.000Z",
  "answered": false,
  "mood": null,
  "note": null,
  "pieceAnswered": false,
  "piece": null,
  "window": {
    "open": true,
    "opensAt": "2026-09-21T11:30:00.000Z",
    "closesAt": "2026-09-21T22:00:00.000Z"
  }
}
```

| Estado | A tela mostra |
|---|---|
| `window.open: false` | o horário da próxima abertura, **antes de tudo** |
| `answered: false` | **só** a pergunta de humor, ocupando a tela |
| `answered: true`, `piece` preenchida | o app, com a peça do dia |
| `answered: true`, `pieceAnswered: true` | o app, sem peça — a diária está completa |

**Sem humor não vem peça.** A pergunta de abertura é pré-requisito, e o `piece` vem `null` até ela ser respondida.

**`note` é a nota pessoal do humor.** Texto livre e opcional que a pessoa pode escrever ao declarar o tempo do dia ("quer especificar mais o que está sentindo?"). Vem `null` quando ela não especificou. É dado **estritamente pessoal**: só volta aqui e em `POST /me/today/mood`, para a própria sessão — **nunca** é agregado nem exposto ao painel do gestor.

### A janela

Escrever a diária acontece dentro do expediente da unidade — por padrão segunda a sexta, das 07:30 às 18:00, no fuso configurado. Ler nunca fecha.

`opensAt` é a abertura vigente quando `open` é verdadeiro, e a próxima quando é falso. As duas datas são UTC: quem formata para o relógio de quem lê é a tela.

A tela lê daqui em vez de descobrir pelo erro. `POST /me/today/mood` e `POST /me/today/answer` respondem **`403`** fora da janela — é a rede para quem chamar a API direto, não o caminho normal.

A janela é **da unidade**, não do processo: fuso e faixas de expediente vivem na
organização e são lidos a cada requisição. `GET /organizations/current` mostra os
dois, e `PATCH /organizations/current` os altera sem passar por deploy.

As variáveis `JOURNEY_WINDOW_ZONE`, `JOURNEY_WINDOW_DAYS` (0 é domingo),
`JOURNEY_WINDOW_OPENS` e `JOURNEY_WINDOW_CLOSES` continuam existindo como **o
padrão de quem nunca configurou a sua** — e é isso que mantém a demonstração
sob controle, porque a unidade da demo não tem janela própria.

### A peça

```json
{
  "id": "...",
  "stage": "CONSCIENTIZAR",
  "title": "Dinheiro também é emoção",
  "body": "...",
  "prompt": "Você abre o app do banco depois de um dia ruim...",
  "options": [{ "label": "Fecho e deixo para depois" }],
  "sourceUrl": "https://www.sicredi.com.br/site/napontadolapis/"
}
```

`stage` é uma das cinco etapas do **método COOPS**, do programa **Cooperação na Ponta do Lápis** do próprio Sicredi: `CONSCIENTIZAR` · `OBSERVAR` · `ORGANIZAR` · `PREPARAR` · `SUSTENTAR`. A trilha é essa ordem, e as peças já respondidas não voltam.

> **`options` só traz `label`.** A consequência de cada escolha fica no servidor e só é revelada depois de escolher — senão não é decisão, é gabarito.

`sourceUrl` deve aparecer na tela. É o que atende o Anexo V 5.V: orientação com fonte.

---

## `POST /me/today/answer`

A decisão sobre a peça do dia.

**Request**

```json
{ "contentPieceId": "...", "answer": "Guardo, mesmo sendo pouco" }
```

`answer` é o `label` exato de uma das opções.

**Response `201`**

```json
{
  "outcome": "É o que o método pede. O valor importa menos que o hábito...",
  "comprehended": true,
  "sourceUrl": "https://www.sicredi.com.br/site/napontadolapis/"
}
```

**`outcome` vem sempre, qualquer que seja a escolha.** A pessoa aprende vendo a consequência do que escolheu — não é quiz com certo e errado.

`comprehended` registra se a escolha foi coerente com o que a peça ensinou. **Escolher diferente não é erro e não deve aparecer como erro na tela**: sem vermelho, sem "resposta errada", sem tentar de novo. Mostre a consequência e siga.

**Erros:** `409` se o humor ainda não abriu o dia ou se a peça já foi respondida. `404` se a peça ou a opção não existir.

---

## `GET /me/track`

O progresso da pessoa pelas cinco etapas do COOPS. Alimenta a tela da trilha.

```json
{
  "stages": [
    { "stage": "CONSCIENTIZAR", "total": 6, "answered": 6 },
    { "stage": "OBSERVAR",      "total": 6, "answered": 6 },
    { "stage": "ORGANIZAR",     "total": 6, "answered": 6 },
    { "stage": "PREPARAR",      "total": 6, "answered": 4 },
    { "stage": "SUSTENTAR",     "total": 6, "answered": 0 }
  ]
}
```

**As cinco etapas vêm sempre, na ordem do método** — inclusive as que ainda não têm peça no catálogo (`total: 0`) e as que a pessoa nem começou (`answered: 0`). A trilha mostra o caminho inteiro: se uma etapa some da resposta, a pessoa deixa de saber que ela existe.

`total` é do catálogo, igual para todo mundo. `answered` é só de quem pediu — a leitura exige dono e empresa juntos, como todo recurso pessoal.

A tela deriva o que precisa: anel cheio quando `answered === total`, etapa atual na primeira com `answered < total`, e trancada nas seguintes. O perfil e as conquistas derivadas (#8) usam essas mesmas contagens: nada de outras pessoas, o caminho da pessoa contra ela mesma.

---

## `GET /organizations/current/indicators`

O painel do gestor. **Só `ADMIN`** — um `USER` recebe `403`. A unidade sai da sessão; não existe parâmetro de empresa, e o mês é o do relógio do servidor.

```json
{
  "suppressed": false,
  "headcount": 20,
  "reach": 14,
  "active": 10,
  "frequency": 4.2,
  "tightRatio": 0.375,
  "averageMood": 3.5,
  "previous": { "tightRatio": 0.7, "averageMood": 2.5 }
}
```

| Campo | O quê |
|---|---|
| `headcount` | pessoas `USER` ativas na unidade |
| `reach` | quantas já registraram alguma coisa, em qualquer data |
| `active` | quantas registraram alguma coisa neste mês |
| `frequency` | dias com registro por pessoa **que manteve diário** no mês |
| `tightRatio` | fração **de quem declarou o mês** em `SLIGHT_SHORTFALL` ou `SEVERE_SHORTFALL` |
| `averageMood` | média de `mood` no mês, de 1 a 5 |
| `previous` | os dois indicadores do mês anterior, para a evolução |

Alcance e adesão são **divisões que a tela faz**: `reach / headcount` e `active / headcount`. A API devolve as contagens cruas para não criar um quarto campo que diz a mesma coisa.

### A supressão vem pronta do servidor, em dois níveis

**Nível da tela.** Abaixo de **5 pessoas com qualquer registro no mês**, a resposta é:

```json
{ "suppressed": true, "headcount": null, "reach": null, "active": null,
  "frequency": null, "tightRatio": null, "averageMood": null, "previous": null }
```

Todos os campos vêm `null`, inclusive o tamanho do grupo. A tela testa `suppressed`, não `active < 5`.

**Nível do indicador.** Cada número tem a sua própria população, e elas não coincidem: quem declarou o mês não é quem registrou humor. Um indicador cuja população fique abaixo de 5 volta `null` **mesmo com o painel aberto**.

Dez pessoas ativas das quais só três declararam produzem uma proporção de três pessoas. Publicá-la porque *outras sete* registraram humor seria o mesmo vazamento entrando pela porta de trás — então `tightRatio` vem `null` e `averageMood` vem preenchido.

O mesmo portão vale para `previous`.

### `null` quer dizer "não dá para mostrar"

Não separamos "sem dado" de "suprimido": dizer qual dos dois é já entrega o tamanho do grupo. Para o gestor a ação é a mesma nos dois casos, então a tela trata todo `null` como **"ainda não há dado suficiente"** — nunca como zero.

### O que nunca vem

Nenhum `userId`, nenhum nome, nenhuma lista, nenhum humor individual, nenhuma declaração. Só contagens. O e2e `unit-indicators.e2e-spec.ts` serializa a resposta e falha se `userId` ou um nome de pessoa aparecer.

---

## `POST /me/goals` · `GET /me/goals` · `PATCH /me/goals/:id`

Metas de guarda pessoais. A meta tem um **valor-alvo autodeclarado**
(`targetAmountCents`, em centavos): a pessoa define quanto quer guardar. É
**autodeclarado e não verificado** — o produto não acessa conta, saldo nem
extrato. O cumprimento de cada mês continua vindo da declaração mensal
(`SelfReport`): o mês fecha "no azul" quando `situation` é `SURPLUS` ou
`BREAK_EVEN`, e o valor entra como o alvo exibido. Recurso estritamente pessoal
— valor, meta e motivo **nunca** vão ao painel do gestor.

Vários objetivos convivem: a pessoa pode ter uma mensal e uma duradoura ativas
ao mesmo tempo.

### `POST /me/goals` — cria a meta

```json
{ "kind": "ENDURING", "targetAmountCents": 60000, "targetMonths": 6 }
```

`kind` é `MONTHLY` (o mês) ou `ENDURING` (manter a guarda por N meses).
`targetAmountCents` é o valor-alvo autodeclarado, em centavos, **> 0 e
obrigatório**. `targetMonths` (2 a 36) é **obrigatório para `ENDURING` e
proibido para `MONTHLY`** — o contrário é **422**. Mês de início e identidade
saem da sessão e do relógio do servidor.

**Response `201`**

```json
{ "id": "...", "kind": "ENDURING", "targetAmountCents": 60000, "targetMonths": 6, "startMonth": "2026-09-01T00:00:00.000Z" }
```

### `GET /me/goals` — as metas da própria pessoa, com progresso derivado

```json
{
  "goals": [
    {
      "id": "...",
      "kind": "ENDURING",
      "status": "ACTIVE",
      "startMonth": "2026-06-01T00:00:00.000Z",
      "targetAmountCents": 60000,
      "monthlyTargetCents": 10000,
      "targetMonths": 6,
      "monthsMet": 2,
      "currentMonthMet": false,
      "termEndedUnmet": false
    }
  ]
}
```

| Campo | O quê |
|---|---|
| `status` | `ACTIVE`, `MET` (cumprida) ou `ENDED` (encerrada pela pessoa) |
| `targetAmountCents` | valor-alvo total autodeclarado, em centavos |
| `monthlyTargetCents` | alvo por mês: total ÷ meses no duradouro; o total no mensal |
| `targetMonths` | 1 para `MONTHLY`, N para `ENDURING` |
| `monthsMet` | meses do prazo que fecharam no azul |
| `currentMonthMet` | se o mês corrente, dentro do prazo, já foi cumprido |
| `termEndedUnmet` | prazo terminou sem cumprir — gatilho da tela acolhedora |

`MONTHLY` vira `MET` quando o mês corrente fecha no azul; `ENDURING` quando os N
meses fecham. **Falha não zera nada:** um mês que não deu não muda o status — a
meta espera até o fim do prazo. `unmetReason` **não** aparece aqui: é privado.

### `PATCH /me/goals/:id` — estender ou encerrar

```json
{ "action": "EXTEND", "targetMonths": 9 }
```

```json
{ "action": "END", "unmetReason": "UNEXPECTED_EXPENSE" }
```

`EXTEND` só vale para uma meta `ENDURING` ativa (senão **409**). `END` aceita um
`unmetReason` **opcional, em opção fechada** — `UNEXPECTED_EXPENSE`,
`INCOME_DROP`, `CHANGED_PRIORITY`, `PREFER_NOT_SAY`, `OTHER`. **Nunca há texto
livre**: o `OTHER` é rótulo fechado, e o app não pede relato. **404** se a meta
não for da pessoa (o isolamento é por `userId`+`companyId`, sem `findById`).

**Response `200`**

```json
{ "id": "...", "status": "ENDED", "targetMonths": null }
```

Criar, estender e encerrar geram `AuditEvent` com ação e recurso, **sem teor**.

---

## `GET /me/streak`

A Colheita Semanal da Home: a ofensiva, o recorde pessoal, os sete dias da
semana e a proteção. **Contra o próprio passado, nunca contra outras pessoas.**

```json
{
  "currentStreak": 4,
  "longestStreak": 11,
  "week": [
    { "date": "2026-09-14T00:00:00.000Z", "weekday": 0, "state": "done" },
    { "date": "2026-09-15T00:00:00.000Z", "weekday": 1, "state": "protected" },
    { "date": "2026-09-16T00:00:00.000Z", "weekday": 2, "state": "today" },
    { "date": "2026-09-17T00:00:00.000Z", "weekday": 3, "state": "future" },
    { "date": "2026-09-18T00:00:00.000Z", "weekday": 4, "state": "future" },
    { "date": "2026-09-19T00:00:00.000Z", "weekday": 5, "state": "closed" },
    { "date": "2026-09-20T00:00:00.000Z", "weekday": 6, "state": "closed" }
  ],
  "freezesAvailable": 0,
  "freezeApplied": true
}
```

| Campo | O quê |
|---|---|
| `currentStreak` | dias seguidos até hoje — ou até ontem, se hoje ainda não foi registrado |
| `longestStreak` | a maior sequência que **a própria pessoa** já alcançou |
| `week` | os sete dias da semana corrente, sempre de segunda a domingo |
| `freezesAvailable` | congelamentos disponíveis nesta semana |
| `freezeApplied` | se um congelamento está segurando a ofensiva agora |

`weekday` é 0 para segunda e 6 para domingo — é a ordem em que a tela desenha, e
não o `getDay()` do JavaScript. `date` é o início do dia em UTC.

### Os seis estados de um dia

| `state` | O quê | Como a tela mostra |
|---|---|---|
| `done` | registrado | cheio |
| `today` | é hoje, e ainda está em aberto | destacado, sem cobrança |
| `future` | ainda não chegou | apagado |
| `missed` | dia útil sem registro | apagado, **sem vermelho e sem rótulo de falha** |
| `protected` | um dia perdido que o congelamento cobriu | ícone de proteção |
| `closed` | a unidade não abriu — fim de semana, feriado, recesso | mais apagado que `missed` |

### Por que a ofensiva não zera

O congelamento é **um por semana, aplicado sozinho**. Ele existe para não punir:
perder um dia sob estresse não pode zerar a sequência de quem mais precisa
(aversão à perda, [`ia-e-limitacoes.md`](ia-e-limitacoes.md)). **Não é moeda nem
prêmio comprável** — é folga concedida pela regra, sem loja e sem ranking.

Dia em que a unidade não abriu não gasta congelamento e não interrompe a
sequência: ele não é dia perdido, é dia que não existiu.

### O que nunca sai daqui

Nada disso chega ao painel do gestor. Não há comparação, classificação nem
posição entre pessoas — o recorde é da pessoa contra ela mesma. A leitura exige
dono e empresa juntos, como todo recurso pessoal.

---

## `GET /organizations/current` · `PATCH /organizations/current`

A organização da sessão. O `PATCH` é **só `ADMIN`**, e o id vem da sessão: não
existe parâmetro de empresa.

```json
{
  "id": "...",
  "name": "Unidade Rondonópolis",
  "slug": "unidade-rondonopolis",
  "active": true,
  "journeyZone": "America/Belem",
  "journeyShifts": [
    { "weekday": 1, "opensAt": "22:00", "closesAt": "24:00" },
    { "weekday": 2, "opensAt": "00:00", "closesAt": "06:00" }
  ]
}
```

| Campo | O quê |
|---|---|
| `journeyZone` | nome IANA do fuso da unidade. Cuiabá é `America/Cuiaba`, Belém é `America/Belem` |
| `journeyShifts` | as faixas de expediente, no relógio da unidade. Vazia quando ela nunca configurou a sua |
| `journeyExceptions` | os dias em que a unidade não trabalha: feriado, ponto facultativo, recesso, parada de fábrica |

`weekday` vai de 0 (domingo) a 6. **Um turno que atravessa a meia-noite são duas
faixas em dias diferentes** — 22:00→24:00 na segunda e 00:00→06:00 na terça.
`"24:00"` só vale em `closesAt`, e quer dizer a meia-noite seguinte.

Um dia pode ter mais de uma faixa: expediente com intervalo de almoço é
06:00→10:00 e 14:00→18:00 no mesmo `weekday`.

**`journeyShifts` substitui a lista inteira.** Mandar duas faixas deixa a unidade
com exatamente essas duas; omitir o campo não mexe nas que existem. Uma faixa
inválida no meio da lista devolve **422** e **não grava nada** — meia janela
gravada seria pior que janela nenhuma.

### Os dias em que a unidade não trabalha

```json
{ "journeyExceptions": [{ "date": "2026-09-07", "reason": "Independência" }] }
```

A lista é **da empresa**, e não uma biblioteca de feriados: feriado municipal e
ponto facultativo não saem de biblioteca nenhuma com confiança, e a cooperativa
atende MT e PA, que não têm o mesmo calendário. Uma lista que a unidade mantém é
honesta sobre de quem é a decisão, e a mesma tabela serve ao recesso e à parada
de fábrica — por isso `reason` é texto, e não uma opção fechada nossa.

Um dia na lista fecha a janela o dia inteiro: `POST /me/today/mood` e
`POST /me/today/answer` respondem **403**, e `GET /me/today` aponta a próxima
abertura, pulando o feriado. Como `journeyShifts`, a lista é **substituída
inteira**.

**Dia sem janela não é falta.** Ele não zera a ofensiva, não gasta congelamento e
aparece em `GET /me/streak` com o estado `closed` — nunca `missed`. Punir alguém
por não ter trabalhado no feriado seria o oposto do produto.

**Erros:** `422` em fuso que não existe, em hora fora de `HH:MM`, em faixa que
fecha antes de abrir, em data fora de `YYYY-MM-DD` ou que não existe no
calendário, e em motivo vazio. `403` para quem não é `ADMIN`.

---

## Endpoints já existentes, para referência

| Rota | O quê |
|---|---|
| `POST /auth/login` | devolve `{ accessToken, user }` |
| `GET /auth/me` | a sessão atual |
| `GET /organizations/current` | a organização da sessão |
| `POST /ai/runs/stream` | SSE: `started` → `token`* → `completed` ou `error` |

O parser SSE em `apps/web/src/services/ai/ai-stream.ts` já trata status, tipo desconhecido e fim sem `completed`. Reaproveite o hook `useAiRun` em vez de refazer.
