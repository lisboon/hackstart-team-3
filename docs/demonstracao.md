# Demonstração

Roteiro de palco e as armadilhas conhecidas. Escrito depois de simular a apresentação contra a pilha em pé, que foi quando a primeira delas apareceu.

---

## ⚠️ A janela da jornada pode fechar o app no palco

Escrever a diária — registrar humor e responder à colheita — acontece dentro do expediente da unidade. **Fora da janela o app mostra "sua próxima diária abre segunda, às 07:30" em vez da pergunta.** Isso é o produto funcionando; num palco é um desastre.

O `docker-compose.yml` sobe com a janela **aberta o tempo todo**, de propósito:

```yaml
JOURNEY_WINDOW_DAYS=0,1,2,3,4,5,6
JOURNEY_WINDOW_OPENS=00:00
JOURNEY_WINDOW_CLOSES=23:59
```

Simular a demonstração às 02:35 mostrou a diária fechada: os sete dias estavam abertos, mas o horário ainda era 07:30–18:00. **O horário do pitch não está no nosso controle**, então a demonstração não depende dele.

**O padrão do código continua sendo a regra de verdade** — segunda a sexta, 07:30 às 18:00, em `DEFAULT_JOURNEY_WINDOW`. Quem subir a API sem o Compose pega a regra, não a demonstração.

### Antes de subir, confira

```bash
docker compose exec api printenv | grep JOURNEY_WINDOW
```

Tem de sair `DAYS=0,1,2,3,4,5,6` e `OPENS=00:00`. Se alguém reiniciou a API com variáveis na linha de comando — para testar a regra, por exemplo — elas ficam até o próximo `--force-recreate` **sem** variáveis:

```bash
LLM_PROVIDER=fake docker compose up -d --force-recreate api
```

### E isso é material de pitch, não desculpa

A janela é configuração da unidade, e dizer isso em voz alta responde à pergunta da banca sobre adesão:

> *A jornada é escrita dentro do expediente porque o art. 4º da CLT conta como serviço efetivo o tempo em que a pessoa está à disposição do empregador. Pedir cinco minutos à noite seria pedir trabalho não pago, e criar passivo trabalhista para quem adotasse o produto. Nesta demonstração ela está aberta para vocês verem o laço inteiro.*

Para mostrar a regra fechando ao vivo:

```bash
JOURNEY_WINDOW_DAYS=1,2,3,4,5 JOURNEY_WINDOW_OPENS=07:30 JOURNEY_WINDOW_CLOSES=18:00 \
  LLM_PROVIDER=fake docker compose up -d --force-recreate api
```

O login continua respondendo `201` e o CVV 188 continua alcançável — fecha a escrita, nunca a porta.

---

## Subir

```bash
LLM_PROVIDER=fake docker compose up -d --build
```

`LLM_PROVIDER=fake` porque `openai` sem `OPENAI_API_KEY` derruba o contêiner `ai`, e o `api` depende dele estar saudável. Nenhuma tela chama modelo hoje, então o provider falso não muda nada do que se vê.

Espere a API responder antes de abrir o navegador:

```bash
until curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health/ready | grep -q 200; do sleep 4; done
```

A rota é `/health/ready`, **não** `/health` — que responde 404.

| | |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger | http://localhost:3001/api-docs |

Credenciais em `SEED_WORKER_*` e `SEED_ADMIN_*` do `.env`.

---

## O laço, na ordem

1. **Entrar** como colaborador — celular, ou F12 em modo dispositivo
2. **Humor do dia**, de 1 a 5. Humor baixo abre os caminhos de apoio
3. **A peça do dia**: a pergunta vem com as opções e **sem a consequência**
4. **Decidir.** A consequência aparece só depois — e escolher diferente do que a peça ensina **não é erro**
5. **Trilha**: o mapa com o caminho já andado
6. **Sair, entrar como gestor** → `/manager` num desktop
7. **Gráfico de acessos por dia**, os indicadores, e `/manager/privacidade` — o que o gestor **não** vê

O passo 7 é o que responde à pergunta do checkpoint sobre uso dos dados, e ele está dentro do produto, não num slide.

---

## Verificar antes, com o roteiro automático

Há um teste de ponta a ponta contra a pilha viva que percorre os dez passos — login, janela, humor, peça, consequência, painel do gestor, supressão, 403 do colaborador e 401 do anônimo.

Se for escrever um script assim, **declare a codificação**: no Windows o `python` lê stdin em cp1252, e o texto das peças aparece como `Ã‰ a que cresce mais rÃ¡pido`. O banco está correto; o instrumento é que mente.

```bash
curl -s ... | PYTHONIOENCODING=utf-8 python -m json.tool
```

Perdi tempo achando que era bug de produto. Era do meu terminal.

---

## O que a demonstração ainda não mostra

Declarado, para ninguém prometer no palco o que não existe:

- **Cinco peças de conteúdo**, uma por etapa do COOPS. Uma trilha diária que acaba em cinco dias
- **Nenhuma integração** com Sicredi X, Sicredi Aprende ou a base da cooperativa. Tudo é autodeclarado, e isso é escolha de privacidade, não limitação a esconder
- **Nada de Microsoft.** O caminho para Entra ID e Azure está escrito em [`aderencia-ao-desafio.md`](aderencia-ao-desafio.md), mas não construído
- **Nenhuma tela chama modelo de IA.** Ver [`ia-e-limitacoes.md`](ia-e-limitacoes.md)
- **A janela não trata feriado nem turno**, e é a mesma para MT e PA, que têm fusos diferentes
