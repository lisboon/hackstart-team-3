# Instruções para assistentes de código

O contexto completo do projeto está em [`CLAUDE.md`](../CLAUDE.md), na raiz do repositório. **Leia antes de sugerir qualquer código.**

Resumo do que não pode ser violado:

1. `companyId` e `userId` vêm de `@CurrentSession()`, nunca do corpo da requisição.
2. Recurso pessoal filtra por dono **e** empresa, **sem exceção para `ADMIN`**.
3. Nenhum teor de humor, meta ou resposta em log ou auditoria.
4. Nenhum agregado com menos de 5 pessoas no recorte.
5. O produto nunca prescreve valor em dinheiro — quem define é a pessoa.
6. Meta não cumprida não é falha; oferece recalibrar.
7. A IA acolhe e encaminha; não investiga sentimento, não aconselha, não diagnostica.
8. CVV 188 a um toque, de qualquer tela.

Comandos usam **pnpm**, não npm: `corepack pnpm check`.
