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

Chamado **ao abrir o app**. Diz se o dia já foi respondido, para a tela saber o que mostrar.

**Response `200`**

```json
{ "entryDate": "2026-09-19T00:00:00.000Z", "answered": false, "mood": null }
```

| `answered` | O que a tela faz |
|---|---|
| `false` | mostra **só** a pergunta de humor, ocupando a tela |
| `true` | mostra o app |

---

## `POST /me/today/mood`

Como a pessoa está hoje. Um toque, sem texto.

**Uma resposta por dia, sem correção.** A pergunta é como ela está agora; deixar reescrever convidaria a ajustar a resposta ao que ela acha que deveria sentir. A próxima chance é amanhã.

**Request**

```json
{ "mood": 3 }
```

`mood` é um inteiro de **1 a 5**, onde **1 é o pior**. Fora disso, ou fracionado, é 422.

> A escala é interna, para a média agregada. **Não aparece na tela** — quem responde escolhe um emoji, não um número.

**Response `201`**

```json
{ "entryDate": "2026-09-19T00:00:00.000Z", "mood": 3 }
```

**`409` quando o dia já foi respondido.** Não deve acontecer no fluxo normal, porque a tela consulta `GET /me/today` antes — é a rede de segurança para toque duplo e corrida.

### O que ainda não existe

**Não há encaminhamento.** Marcar o pior nível registra e mais nada — a rota de apoio depende de saber quais canais existem de verdade, e isso ainda não foi validado com a Sicredi (issue #17).

O que **deve** existir na tela desde já é o acesso ao **CVV 188**, a um toque, de qualquer lugar (issue #13). É serviço público e não depende de integração nenhuma.

---

## Endpoints já existentes, para referência

| Rota | O quê |
|---|---|
| `POST /auth/login` | devolve `{ accessToken, user }` |
| `GET /auth/me` | a sessão atual |
| `GET /organizations/current` | a organização da sessão |
| `POST /ai/runs/stream` | SSE: `started` → `token`* → `completed` ou `error` |

O parser SSE em `apps/web/src/services/ai/ai-stream.ts` já trata status, tipo desconhecido e fim sem `completed`. Reaproveite o hook `useAiRun` em vez de refazer.
