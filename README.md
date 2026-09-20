# Hackathon Star Nest

Base genérica para o SESI Experience: NestJS + Prisma, PostgreSQL, FastAPI e Next.js.
O navegador chama somente a Core API. Ela autentica, revalida a sessão no banco,
determina o tenant e registra a tentativa de IA; Python executa o provider sem persistir domínio.

## Estrutura e responsabilidades

- `apps/api`: backend, banco, autorização e contratos — estrela de desenvolvimento.
- `apps/ai`: provider, prompt e execução — dev Python, com revisão da estrela.
- `apps/web`: jornada, estados e integração — dev frontend.
- `docker-compose.yml`: inicia os três serviços e PostgreSQL juntos.

O monorepo permite mudanças de contrato e implementação no mesmo commit.
Este é o template padrão para o evento.
O seed cria o administrador da organização. Não há superadmin nem administração global.

## Executar localmente

Copie `.env.example` para `.env`, ajuste os segredos e escolha:

- `LLM_PROVIDER=fake` para validar integração sem chamadas pagas.
- `LLM_PROVIDER=openai` e `OPENAI_API_KEY` para usar o provider real.
- `LLM_PROVIDER=bedrock` e `BEDROCK_REGION` para usar o Amazon Bedrock. Ele fala o
  mesmo protocolo da OpenAI em `bedrock-mantle`, então não há chave: o token é
  assinado a cada requisição a partir das credenciais AWS do ambiente e renovado
  na metade da vida. `/health/ready` falha com 503 quando não há credencial,
  em vez de o container parecer saudável até alguém perguntar.

```powershell
docker compose up -d --build
docker compose logs -f api ai
```

Web: http://localhost:3000. API: http://localhost:3001. Swagger: http://localhost:3001/api-docs.
Para apresentar, siga [`docs/demonstracao.md`](docs/demonstracao.md): a janela da jornada
fecha a diária fora do expediente, e o Compose a mantém aberta de propósito.
Acesse com `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` do `.env`.
O Compose é de desenvolvimento, publica portas apenas em localhost e usa credenciais locais.
Os templates compartilham portas: execute um de cada vez. `docker compose stop` preserva os dados.
`NEXT_PUBLIC_API_URL` é aplicada no build: reconstruir o web após alterá-la.

## Verificar

Requisitos: Node 24, Corepack/pnpm 11.1.1, Python 3.12–3.14, uv 0.12.15 e Docker.

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm --dir apps/api prisma:generate
corepack pnpm check
corepack pnpm --dir apps/api test:e2e --runInBand
uv sync --directory apps/ai --locked
uv run --directory apps/ai --locked ruff check .
uv run --directory apps/ai --locked pytest -q
```

Os E2E usam PostgreSQL descartável na porta 5433, separado do desenvolvimento.
`E2E_DATABASE_URL` permite indicar outro banco local de testes; no CI usa `DATABASE_URL`.
Não configure essas variáveis com banco de aplicação.

Com o Compose iniciado usando `LLM_PROVIDER=fake`, execute `node scripts/smoke.mjs`.
O smoke verifica web por HTTP, readiness, login, tenant e SSE via Core API/Python.
O script lê `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` do ambiente; exporte os mesmos valores do `.env` se alterou os defaults.
Testes de integração com PostgreSQL e smoke do Compose também rodam no GitHub Actions.

## Contrato e limites

- `POST /ai/runs/stream`: recebe `messages` e `conversationId` opcional; identidade vem da sessão.
- Mensagens aceitam `user` e `assistant`; até 100 mensagens de 1–50.000 caracteres, respeitando o limite HTTP de corpo.
- SSE emite `started`, `token`, `completed` ou `error`. Encerramento sem `completed` é falha.
- Auditoria `ai.run.requested` é obrigatória antes da chamada. Ela comprova a tentativa, não o sucesso do modelo.
- Timeout inclui o corpo da resposta. Cancelar no navegador interrompe a chamada upstream.
- Python tem prazo de 50 segundos; Core API, 60 segundos. SDK sem retry automático nesta execução.
- Provider fake é proibido quando `PRODUCTION=true` no Python. Ele nunca substitui silenciosamente uma falha real.
- Operações de usuários combinam recurso e tenant; ADMIN atua somente na própria organização.

Sem RAG, tools, domínio ou navegação fictícia antecipados. O frontend é um shell de integração;
a jornada do desafio será construída após o início autorizado. Antes da demo, validar também
provider real, dados sintéticos e ambiente de apresentação.

`LICENSE` preserva a atribuição das referências.
Nunca versionar segredos nem enviar dados confidenciais ao provider.

## Frontend: organização e manutenção

O código está em `apps/web/src`: `app` compõe a página; `components/ui` e
`components/form` oferecem peças reutilizáveis; `components/auth` e
`components/ai` compõem os fluxos. Hooks coordenam estado; services executam
requests; schemas validam entradas. Arquivos usam kebab-case e imports `@/`.

React Hook Form + Zod controlam formulários. Tailwind + primitivas shadcn mantêm
o visual. SWR e Zustand não estão instalados: adicionar somente quando existir
consulta com cache ou estado compartilhado que os justifique.

`corepack pnpm --dir apps/web test` executa testes nativos (SSE, HTTP, schemas e
limites de dependência) e Vitest/Testing Library (componentes/hooks).
`corepack pnpm check:web` executa lint, tipos, testes e build. Após mover rotas em
um checkout já usado, `corepack pnpm --dir apps/web exec next typegen` regenera os
tipos locais do Next.

Os três apps usam um único gerenciador: `corepack pnpm install` na raiz instala API
e web juntos. Não há `package-lock.json` nem instalação separada por app.

Token fica em memória. Sair limpa a sessão e aborta a execução ativa; 401
autenticado retorna ao acesso, enquanto 403 mantém a sessão. O frontend não
substitui a autorização/tenant do backend. Streaming anuncia estados de
execução sem anunciar cada token individualmente.

Reutilize componentes por responsabilidade e significado, não por quantidade
de linhas. Não adicionar providers, stores, diretórios ou dependências sem uso.
UI genérica não importa domínio/transporte; serviços não importam React. Essas
fronteiras são verificadas pelo lint e pelos testes.
