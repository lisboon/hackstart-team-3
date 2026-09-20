# Aderência ao desafio

Resposta ao desafio *"Devo, não nego, mas a que custo eu pago?"* — Sicredi Ouro Verde MT/PA e SESI-MT, Hackathon SESI Experience 2026.

Cada afirmação sobre o que está pronto aponta para um arquivo deste repositório. O que ainda não existe está declarado como não existindo.

---

## 1. O gabarito da página 3

O desafio diz que o problema estará resolvido quando o público demonstrar maior compreensão, maior capacidade de planejamento e decisões mais conscientes, com redução da percepção de sofrimento — e que isso deve ser observável por indicadores.

| O que o desafio pede | Onde isso acontece |
|---|---|
| Maior compreensão sobre temas financeiros | Peça diária do COOPS com decisão e consequência — `POST /me/today/answer` marca `comprehended` |
| Decisões mais conscientes | A pessoa escolhe antes de ver o efeito; a consequência fica no servidor até a escolha |
| Maior capacidade de planejamento | Metas de guarda pessoais com valor-alvo que a pessoa define — `POST/GET /me/goals`, cumprimento derivado da declaração mensal, valor autodeclarado e não verificado (#71) |
| Redução da percepção de sofrimento | Humor diário de 1 a 5 — `POST /me/today/mood`, agregado em `averageMood` |
| Redução dos níveis de estresse financeiro | Declaração mensal em `SelfReport.situation`, agregada em `tightRatio` |
| Maior utilização dos recursos de apoio | `supportUses` — quantas aberturas de canal no período, sem saber de quem |
| Número de pessoas atendidas | `reach` |
| Adesão às ações propostas | `active` |
| Frequência de utilização | `frequency` |
| Uso dentro da jornada de trabalho | Janela de escrita da unidade, em `GET /me/today` |
| Evolução dos resultados ao longo do tempo | `previous` |

As quatro últimas saem de `GET /organizations/current/indicators`, documentado em [`contratos.md`](contratos.md). Os nomes coincidem com os do desafio porque o endpoint foi escrito a partir da página 3.

---

## 2. As restrições da página 4

### 2.1 Infraestrutura tecnológica — *preferência por compatibilidade com o ecossistema Microsoft*

**Hoje não há nada de Microsoft no projeto.** O caminho existe e é curto, mas é evolução, não entrega:

| Serviço em `docker-compose.yml` | Destino em Azure |
|---|---|
| `api`, `ai`, `web` | Azure Container Apps — os três já são contêineres |
| `backend-db` | Azure Database for PostgreSQL |
| Autenticação própria (JWT) | Microsoft Entra ID, trocando `AuthGuard` pelo provedor |

O backend é TypeScript, linguagem mantida pela Microsoft. Os três serviços já têm `Dockerfile`, e o CI constrói a imagem de produção da API como verificação (`.github/workflows/ci.yml:80`) — ninguém publica em registro ainda. A migração é de destino de deploy, não de reescrita.

### 2.2 Proteção de dados e privacidade — *LGPD, minimização, anonimização*

**Minimização.** O produto não tem acesso a extrato, saldo, transação ou histórico bancário. Tudo é autodeclarado: a situação do mês, o humor do dia e o valor-alvo que a pessoa define na meta de guarda (#71) — nunca verificado contra saldo. A nota opcional do humor (#91), quando a pessoa escreve o que está sentindo, é estritamente pessoal: só volta para ela em `GET /me/today` e `POST /me/today/mood`, nunca entra em nenhum indicador do gestor. Essa não é limitação técnica a remover — é a escolha que torna o produto aceitável dentro de uma empresa.

**Anonimização, em dois níveis.** O painel do gestor suprime a unidade inteira abaixo de cinco pessoas com registro no mês, e suprime **cada indicador separadamente** quando a população daquele número é menor que cinco. Dez pessoas ativas das quais só três declararam produzem uma estatística de três pessoas; publicá-la porque outras sete registraram humor seria o mesmo vazamento pela porta de trás.

A supressão é regra de domínio, não de tela: o painel nunca recebe um número que não pode mostrar. `apps/api/test/unit-indicators.e2e-spec.ts` prova, contra banco de verdade, que a resposta não contém `userId` nem nome de pessoa.

**Bases legais.**

| Tratamento | Base legal | Observação |
|---|---|---|
| Situação mensal e humor diário | Consentimento do titular | Dado fornecido pela própria pessoa, para uso dela |
| Indicadores agregados da unidade | Legítimo interesse, com anonimização | Nenhum dado individual chega ao empregador |
| Registro de auditoria | Cumprimento de obrigação e segurança | Guarda ação e recurso, nunca teor |

O empregador **não trata dado de saúde individualmente**. O que ele vê é média de unidade, suprimida quando o grupo é pequeno demais para proteger quem está dentro dele.

### 2.3 Segurança da informação

`AuthGuard` e `RolesGuard` em toda rota; isolamento por empresa na assinatura de cada gateway de recurso pessoal, que exige dono e empresa juntos e não expõe busca por id. Auditoria em `AuditEvent`, sem teor. Contrato OpenAPI verificado no CI, e `pnpm audit --prod` no pipeline.

### 2.4 Integração e escalabilidade

O desafio nomeia três iniciativas que a Sicredi Ouro Verde já opera. **Nenhuma integração está construída** — não temos API de nenhuma das três. A proposta:

| O que já existe | Como o Colheita se encaixa |
|---|---|
| Quiz de diagnóstico no app **Sicredi X** | Diagnóstico de entrada: define em qual etapa do COOPS a pessoa começa, em vez de todo mundo começar do zero |
| Cursos do **Sicredi Aprende** | Aprofundamento. A trilha diária identifica o tema onde a pessoa erra mais e encaminha para o curso correspondente |
| **Assessores multiplicadores** nas unidades | Já é um dos caminhos de apoio oferecidos no app, e o painel agregado diz ao gestor quando vale levar um |

O conteúdo das peças deriva do programa público **Cooperação na Ponta do Lápis**, e cada peça carrega `sourceUrl` exibido na tela.

**Escalabilidade:** multiempresa desde o primeiro dia. `companyId` atravessa todos os modelos e todas as consultas, então atender uma segunda indústria é cadastrar uma segunda empresa.

### 2.5 Aderência temática — saúde mental no contexto de SST

Desde 26/05/2026 a NR-1 inclui riscos psicossociais no Gerenciamento de Riscos Ocupacionais. O painel agregado produz evidência para o GRO sem expor ninguém.

**Não afirmamos conformidade com a NR-1.** Declarar conformidade é atribuição do SESMT da empresa; o que entregamos é o dado que sustenta o programa.

### 2.6 Aplicabilidade interinstitucional

O mesmo produto serve a cooperativa e a indústria atendida pelo SESI sem nenhuma alteração: muda a empresa, não o código. Os caminhos de apoio já incluem assessor da agência, RH, canal confidencial e saúde ocupacional do SESI.

### 2.7 Potencial de validação

Piloto proposto: uma indústria que seja **simultaneamente** atendida pelo SESI e associada da Sicredi Ouro Verde, com 40 a 120 pessoas — grande o bastante para a supressão não bloquear o painel, pequena o bastante para acompanhar.

Desenho: quatro semanas, adesão voluntária, sem meta individual. O que se mede é o que o endpoint já devolve — alcance, adesão, frequência e evolução — mais a proporção de declarações de aperto entre o primeiro e o último mês.

---

## 3. O que este produto não faz

- **Não usa inteligência artificial.** Nenhuma tela chama modelo. Ver [`ia-e-limitacoes.md`](ia-e-limitacoes.md)
- **Não acessa conta bancária.** Open Finance com consentimento é evolução possível, não promessa
- **Não diagnostica** e não substitui atendimento profissional. O aviso e o CVV 188 ficam no rodapé de toda tela autenticada, inclusive fora do horário da jornada
- **Não mede estresse especificamente financeiro** no dia a dia: o humor diário é geral. A declaração mensal é que carrega a dimensão financeira
- **Não promete conformidade** com NR-1 nem com qualquer norma

### 3.1 A janela da jornada

Registrar humor e responder à colheita acontecem dentro do expediente da unidade — **por padrão de segunda a sexta, das 07:30 às 18:00**, no fuso dela. Consultar o que já foi registrado, rever a trilha, entrar no app e alcançar o CVV 188 seguem disponíveis 24 horas.

Isso não é limitação a contornar. O art. 4º da CLT conta como serviço efetivo o tempo em que a pessoa está à disposição do empregador, e a jurisprudência do TST já aplicou isso a aplicativo corporativo usado fora do expediente — vira hora extra, ou sobreaviso por analogia à Súmula 428. Pedir cinco minutos à noite num app de saúde ocupacional seria pedir trabalho não pago, e criar passivo para quem adotasse o produto.

**A janela é da unidade, e sabe o que é dia de trabalho:**

- **Feriado fecha a janela.** Cada unidade mantém a sua lista de dias sem
  expediente — feriado nacional, estadual, municipal, ponto facultativo, recesso
  e parada de fábrica. Não é biblioteca de feriados: MT e PA não têm o mesmo
  calendário, e quem decide é a empresa. `test/journey-window-exceptions.e2e-spec.ts`
  prova que o dia fecha e que nada é escrito nele
- **Turno da noite é uma janela como outra qualquer.** A janela é uma lista de
  faixas por dia, e 22:00–06:00 são duas faixas em dias diferentes — a segunda
  fechando em 24:00, a meia-noite seguinte. Quem entra às 22:00 registra
- **Dia sem janela não conta como falha.** Fim de semana e feriado não zeram a
  ofensiva nem gastam o congelamento: aparecem como `closed`, não como falta. A
  pesquisa que embasou a #60 já diz que ofensiva que quebra gera culpa, e num app
  para quem está sob sofrimento financeiro punir quem não trabalhou no feriado
  seria o oposto do produto

A janela **deixou de ser a mesma para todos**: fuso e faixas de expediente são
colunas da unidade, e `PATCH /organizations/current` as ajusta sem deploy. Cuiabá
em UTC−4 e Belém em UTC−3 abrem às 07:30 de cada uma — `test/journey-window-by-unit.e2e-spec.ts`
prova, contra banco de verdade, que a mesma hora de parede vira dois instantes.
A unidade que nunca configurou a sua segue em seg–sex, 07:30–18:00.

O roteiro de apresentação e as armadilhas conhecidas estão em [`demonstracao.md`](demonstracao.md).

## 4. Limites que a evidência impõe

Engajamento é o maior risco: apps de saúde mental retêm cerca de 3,3% dos usuários em 30 dias. A categoria já existe — a Zogo opera educação financeira gamificada em mais de 250 instituições, e não alegamos ineditismo. Educação financeira isolada explica cerca de 0,1% da variância em comportamento financeiro (Fernandes, Lynch e Netemeyer, *Management Science*, 2014), e é por isso que o produto não é um curso: é decisão repetida com consequência visível.

E se a renda não cobre o básico, nem meta nem conteúdo resolvem. O que o produto tem a oferecer nesse caso é o encaminhamento ao assessor e ao apoio da empresa — dizer o contrário seria culpabilizar quem não tem escolha.

---

## 5. Verificação

```bash
corepack pnpm --dir apps/api prisma:generate
corepack pnpm check
corepack pnpm --dir apps/api test:e2e --runInBand
corepack pnpm --dir apps/api build && corepack pnpm --dir apps/api test:openapi
```

259 testes de API, 176 de web mais 58 de contrato, e 83 end-to-end. O CI roda os quatro trabalhos — `api`, `web`, `ai` e `smoke` — em todo pull request.
