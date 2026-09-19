## 📝 Descrição
<!-- Resuma o que foi feito. O GitHub Copilot usa isso para entender o contexto geral. -->
<!-- Se houver uma issue relacionada, escreva "Closes #<número>" aqui -->

## 🚀 Changelog
<!-- Esta seção será usada para gerar as notas de lançamento. Seja conciso. -->
<!-- Formato sugerido: [TIPO] Descrição curta (ex: [Feature] Adiciona check-in de humor) -->

## 🔍 Como Testar / Pontos de Atenção
<!-- Ajuda o revisor e o Copilot a saberem onde focar. -->
1. Passo a passo simples para testar (ex: faça login e abra /hoje).
2. Mencione se houve migration, mudança de contrato ou env vars novas.

## ✅ Checklist
- [ ] O código compila/roda sem erros novos (`corepack pnpm check`).
- [ ] Fiz um auto-review do meu próprio código.
- [ ] As dependências (se houver) foram atualizadas pelo lockfile, sem editar à mão.

## 🔒 Privacidade e segurança
<!-- O produto guarda humor, metas e situação financeira declarada. Estas linhas não são burocracia. -->
- [ ] `companyId` e `userId` vêm de `@CurrentSession()`, nunca do corpo da requisição.
- [ ] Recurso pessoal filtra por dono **e** empresa, **sem exceção para `ADMIN`**.
- [ ] Nenhum teor de humor, meta ou resposta entrou em log ou em `AuditEvent.metadata`.
- [ ] Nenhum agregado é exibido com menos de 5 pessoas no recorte.

## 💙 Regras do produto
<!-- Vêm do alerta da coringa: meta que a pessoa não consegue bater aumenta o peso mental dela. -->
- [ ] Nenhuma tela diz à pessoa quanto ela deveria guardar — quem define o valor é ela.
- [ ] Meta não cumprida não aparece como erro nem zera nada; oferece recalibrar.
- [ ] Se a tela coleta sofrimento, o acesso ao CVV 188 está a um toque.
- [ ] A IA acolhe e encaminha; não investiga sentimento, não aconselha, não diagnostica.

## 📱 Interface
- [ ] Funciona em 390px de largura.
- [ ] Campos têm label, erro associado e foco no primeiro inválido.
