# Publicação

A demonstração está no ar em
**<https://d3ej5x5w7io4m7.cloudfront.net>**, com HTTPS válido e redirecionamento
de HTTP. É o endereço para o QR code e para a apresentação.

Contas semeadas: `colaborador@backend.com.br` e `admin@backend.com.br`, senha em
`.env.example`. Dado fictício — nenhuma informação de pessoa real está lá.

## Subir uma alteração

```bash
./scripts/deploy.sh web     # mexeu em tela
./scripts/deploy.sh api     # mexeu em API
./scripts/deploy.sh db      # regravar o banco com o estado local de hoje
```

Cada um constrói, empurra para o ECR e força o ECS a trocar a task. Leva de 4 a
8 minutos, com o endereço no ar o tempo todo: o balanceador só manda tráfego
para a task nova depois que ela passa no `/health/ready`.

**Não construa a imagem do web à mão.** Duas coisas nela são assadas no build e
não dá para corrigir depois:

| Argumento | Valor na publicação | Por quê |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `""` (vazio) | O navegador passa a chamar caminho relativo. Uma origem só, e CORS deixa de existir |
| `API_INTERNAL_URL` | `http://localhost:3001` | Para onde o servidor do Next encaminha. Numa task ECS com `awsvpc` os contêineres dividem a pilha de rede, então não é `http://api:3001` |

`output: standalone` congela os `rewrites` no build. Passar esses valores como
variável de ambiente da task **não tem efeito** — foi assim que a primeira
revisão caiu, com `getaddrinfo ENOTFOUND api`.

É o que o script faz por você. Use o script.

## Serviço de trabalho (PWA)

O `sw.js` tem um `VERSION` no topo. **Toda alteração visível exige subir esse
número** — senão quem já abriu o app continua vendo a versão antiga, com cache
do serviço de trabalho servindo por cima do deploy novo. Já aconteceu duas
vezes.

## A forma da coisa

```
      Internet
         │ HTTPS
   CloudFront  d3ej5x5w7io4m7.cloudfront.net   (certificado grátis, cache desligado)
         │ HTTP
        ALB  colheita-alb                      (checa /health/ready)
         │ :3000
   ┌─────┴──────────────────────────────┐
   │ task Fargate — uma pilha de rede   │
   │  web :3000 ─→ api :3001 ─→ db :5432│
   │                  └──────→ ai :8000 │
   └────────────────────────────────────┘
```

Os quatro contêineres numa task só, falando por `localhost`. Não é a arquitetura
que eu escolheria para produção — é a que cabe em uma task, sem VPC, sem RDS e
sem descoberta de serviço, e que sobe inteira ou não sobe. Para um dia de
hackathon, esse é o critério certo. `infra/` (PR #89) tem o Terraform da versão
de verdade, com RDS e serviços separados.

O banco sobe **já semeado**: a imagem `colheita/db` carrega um dump do banco
local. O estado apresentado é o que foi conferido em casa, e a API perde um
ponto de falha no arranque — migrar e semear na frente da banca era risco sem
ganho.

## Limites conhecidos, e por quê

- **Segredos em texto puro na definição de task.** Deveriam estar no Parameter
  Store; `infra/ssm.tf` faz isso. Não entrou porque é dado de demonstração e o
  tempo foi para o que a banca vê. Fica escrito para não passar por descuido
- **`THROTTLE_LIMIT` em 5000, `AUTH_THROTTLE_LIMIT` em 500.** Por trás do proxy
  do Next toda requisição chega com o IP do contêiner web, então o limite por
  IP viraria um limite para a plateia inteira — a sexta pessoa a ler o QR code
  levaria 429. Os padrões do código (30 e 5) continuam sendo a regra; a exceção
  é declarada aqui em vez de escondida
- **Uma task, sem réplica.** Se ela cair, o ECS sobe outra em ~2 minutos e o
  endereço fica fora nesse intervalo
- **Sem domínio próprio.** O Route53 recusa registro de domínio em conta Free
  Tier. O nome do CloudFront é o que dá HTTPS hoje

## Depois da apresentação

```bash
./scripts/teardown.sh            # mostra o que apagaria
./scripts/teardown.sh --apagar
```

A conta é pessoal e cobra por hora parada — a task e o balanceador somam por
volta de US$ 2,50 por dia sem ninguém usando.

**E apague a chave de acesso raiz** usada no hackathon: console → Security
credentials → Access keys → Delete. Ela foi colada em texto puro durante o
trabalho e vale para a conta inteira.
