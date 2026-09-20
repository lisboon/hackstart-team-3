# Contexto do projeto

Solução do time 3 para o desafio Sicredi no Hackathon SESI Experience 2026. Leia antes de escrever qualquer código.

## O que é

Um app diário de saúde financeira e bem-estar para trabalhadores. A pessoa entra, diz como está se sentindo, recebe uma peça curta de conteúdo e demonstra que entendeu. O gestor vê **apenas agregados da unidade**, nunca dados individuais.

**A tese, em uma frase:** o produto nunca diz à pessoa o que ela deveria conseguir; ele mostra o que ela já conseguiu.

## Regras inegociáveis

Estas não são preferências de estilo. Violar qualquer uma inverte o produto.

### Privacidade

1. **`companyId` e `userId` vêm sempre de `@CurrentSession()`**, nunca do corpo ou da query. Nenhum endpoint aceita id de usuário ou empresa vindo do cliente.
2. **Recurso pessoal filtra por dono E empresa, sem exceção para `ADMIN`.** Um `ADMIN` que tente ler humor, meta ou resposta de outro usuário da mesma empresa recebe 403 ou 404. Isso é diferente do resto do template, onde `ADMIN` enxerga a organização inteira.
3. **Nada de teor sensível em log ou auditoria.** Registre a ação (`daily.completed`), nunca o conteúdo do humor, da resposta ou da meta.
4. **Agregado nenhum aparece com menos de 5 pessoas** no recorte. Abaixo disso devolva indisponível, não o número. Agregação em grupo pequeno não é anonimização.

### Produto

5. **Nunca prescreva um valor em dinheiro.** Não existe "guarde R$ 150". Quem define é a pessoa. Se ela pedir ajuda, mostre a faixa que ela mesma registrou antes e deixe ela escolher.
6. **Meta não cumprida não é falha.** Sem vermelho de erro, sem zerar nada. Ofereça recalibrar. `Goal.status` não tem o valor "falhou" de propósito.
7. **A IA acolhe e encaminha — não investiga, não aconselha sobre emoção, não diagnostica.** Diante de humor de sofrimento: *"Vi que hoje não está fácil. Quer que eu pule a lição e te mostre com quem falar?"* — e **quem escolhe com quem falar é a pessoa**. O gestor está na lista, mas nunca é o padrão.
8. **Acesso ao CVV 188 a um toque, de qualquer tela.** O app coleta sofrimento, então tem dever de cuidado. Junto com o aviso de que não diagnostica nem substitui profissional.

## Comandos

**O projeto usa pnpm em tudo. Não use `npm`.**

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm --dir apps/api prisma:generate

corepack pnpm check                                # api + web: lint, tipos, testes, build
corepack pnpm check:api
corepack pnpm check:web
corepack pnpm --dir apps/api test:e2e --runInBand   # sobe Postgres de teste na 5433
corepack pnpm --dir apps/api test:openapi

docker compose up -d --build ; node scripts\smoke.mjs
```

Python, em `apps/ai`: `uv sync --locked`, `uv run --locked ruff check .`, `uv run --locked pytest -q`.

## Arquitetura

```
apps/api   NestJS + Prisma + PostgreSQL   contratos, autorização, tenant, regras
apps/ai    FastAPI                        prompt e provider (openai | bedrock | fake)
apps/web   Next.js                        PWA do colaborador + dashboard do gestor
```

O navegador fala **só** com a Core API. Ela autentica, revalida a sessão no banco, determina a organização e registra a auditoria antes de chamar o Python.

### Backend — onde as coisas vão

Espelhe `apps/api/src/modules/company/`, que é o menor exemplo completo:

```
modules/<contexto>/
  domain/<nome>.entity.ts        + domain/validators/
  gateway/<nome>.gateway.ts      interface
  repository/                    impl Prisma + mapper
  usecase/<acao>/                usecase + dto
  facade/  factory/facade.factory.ts   wiring manual
infra/http/<contexto>/           controller, module, service, dto
```

Registre o module em `infra/http/app.module.ts`. Use `@UseGuards(AuthGuard)` e `@CurrentSession()`.

`apps/api/src/metadata.ts` também é gerada pelo build e **não** é versionada. Ela fica velha ao trocar de branch, e aí o typecheck quebra apontando DTO que não existe — rode `corepack pnpm --dir apps/api build`, ou apague o arquivo, antes de acusar o código.

**Migrations são escritas à mão** em `prisma/migrations/<timestamp>_<nome>/migration.sql` — as existentes são manuais. A saída de `prisma:generate` em `apps/api/generated` **não** é versionada: ao puxar uma alteração de schema, rode `corepack pnpm --dir apps/api prisma:generate` antes do typecheck.

### Frontend — fronteiras verificadas por teste

`apps/web/tests/boundaries.test.mjs` quebra o build se violar:

- `components/ui/**` e `components/form/**` **não** importam services, hooks, domínio ou transporte
- `services/**` e `lib/http/**` **não** importam React

Organize em `schemas/`, `services/<contexto>/`, `hooks/<contexto>/`, `components/<contexto>/`. Reaproveite `FormLayout`, `InputField`, `TextareaField`, e o `useAiRun` de `hooks/ai/` para streaming.

**390px é requisito**, não capricho — o público é trabalhador de indústria.

### IA — três amarras

1. O backend calcula, a IA traduz.
2. Só fala do conteúdo aprovado, citando a fonte.
3. Não diagnostica, não investiga sentimento.

Contrato SSE: `started` → `token`* → `completed` **ou** `error`. Fim sem `completed` é falha, de propósito. **Novo tipo de evento exige alterar três lugares:** `apps/ai/src/app/schemas.py`, `apps/web/src/services/ai/ai-stream.ts` (tipo desconhecido lança erro) e `apps/web/src/hooks/ai/use-ai-run.ts`.

## O que não fazer

- Não adicionar SWR, Zustand, RAG, agentes ou biblioteca nova sem consumidor real.
- Não criar sistema de pontos trocáveis, prêmio material, liga ou ranking entre pessoas. Conquistas existem como reconhecimento, não como moeda — o cliente recusou premiação.
- Não editar lockfile à mão.
- Não versionar `.env` nem dado real. A demo usa dados fictícios.
- Não deixar `main` quebrada: rode `corepack pnpm check` antes de empurrar.

## Convenções

Commits em inglês, no imperativo, com escopo: `feat(api):`, `fix(web):`, `test(ai):`, `chore:`. Corpo quando a decisão não for óbvia — explique o *porquê*, não o *o quê*.

Arquivos em kebab-case, componentes e tipos em PascalCase, hooks `useAlgo`, alias `@/` apontando para `src`. TypeScript strict, sem `any`. Comentário só para decisão não evidente.
