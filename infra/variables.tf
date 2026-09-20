variable "project" {
  description = "Prefixo de todo recurso."
  type        = string
  default     = "colheita"
}

variable "region" {
  description = "Onde ficam o cluster, o banco e o load balancer."
  type        = string
  default     = "us-east-1"
}

variable "image_tag" {
  description = "Tag das imagens que a task definition aponta. Passe o sha do git."
  type        = string
}

# ---------------------------------------------------------------- exposição
variable "enable_cloudfront" {
  description = <<-EOT
    Põe uma distribuição CloudFront na frente do load balancer. Ela traz
    certificado válido em *.cloudfront.net sem domínio e sem trabalho de DNS,
    que é o jeito mais barato de ter HTTPS. Ignorado quando domain_name existe.

    O padrão é `true`, diferente do que seria numa API qualquer: `apps/web` é um
    PWA e `navigator.serviceWorker` só existe em contexto seguro. Sobre HTTP
    puro o app abre, mas sem service worker — ou seja, sem instalação e sem a
    tela offline, que são requisito do desafio.
  EOT
  type        = bool
  default     = true
}

variable "domain_name" {
  description = <<-EOT
    Domínio registrado no Route 53, com hosted zone já existente. Preenchido,
    coloca um certificado ACM no load balancer e serve o app por esse nome.
    Vazio, vale o modo CloudFront acima.
  EOT
  type        = string
  default     = ""
}

# -------------------------------------------------------------- deploy CI/CD
variable "github_repo" {
  description = "owner/name do repositório autorizado a fazer deploy via OIDC."
  type        = string
}

variable "github_branch" {
  description = "Só esta branch pode assumir a role de deploy."
  type        = string
  default     = "main"
}

variable "github_subject_prefix" {
  description = <<-EOT
    O GitHub está migrando o subject do token OIDC para uma forma imutável, que
    carrega os ids numéricos de dono e repositório em vez dos nomes. O token
    passa a ler "repo:owner@73729844/name@1311959423:ref:...", que não casa com
    política escrita sobre o caminho textual — e o STS responde "Not authorized
    to perform sts:AssumeRoleWithWebIdentity".

    Leia o seu com:
      gh api repos/<owner>/<name>/actions/oidc/customization/sub --jq .sub_claim_prefix

    Preenchido, as duas formas são aceitas; vazio, só a textual.
  EOT
  type        = string
  default     = ""
}

# ------------------------------------------------------------------ tamanho
variable "task_cpu" {
  description = "CPU do Fargate para a task inteira (web + api + ai)."
  type        = number
  default     = 1024
}

variable "task_memory" {
  description = <<-EOT
    Memória do Fargate em MiB. Next standalone fica perto de 200 MiB, o Nest
    perto de 180 e o FastAPI com botocore perto de 250; 2048 dá folga e é o
    menor valor válido para 1024 de CPU.
  EOT
  type        = number
  default     = 2048
}

variable "db_instance_class" {
  description = "Classe do RDS. A demo cabe folgada na menor."
  type        = string
  default     = "db.t4g.micro"
}

variable "log_retention_days" {
  type    = number
  default = 14
}

# ---------------------------------------------------------------------- IA
# apps/ai fala um protocolo só — chat completions da OpenAI — e o Bedrock
# também o serve, então a escolha abaixo é sobre quem é cobrado. "bedrock" gasta
# o crédito desta conta e não guarda chave nenhuma; "openai" é cobrado em
# platform.openai.com, fora dos créditos do hackathon.
variable "llm_provider" {
  description = "Com quem apps/ai fala: bedrock ou openai."
  type        = string
  default     = "bedrock"

  validation {
    condition     = contains(["bedrock", "openai"], var.llm_provider)
    error_message = "llm_provider deve ser bedrock ou openai; fake é proibido com PRODUCTION=true."
  }
}

variable "bedrock_region" {
  description = <<-EOT
    Região do endpoint bedrock-mantle. Pode diferir de var.region, mas a chave
    de curta duração que apps/ai assina só é aceita pela região para a qual foi
    emitida — este valor tem de casar com o host.
  EOT
  type        = string
  default     = "us-east-1"
}

variable "bedrock_model" {
  description = <<-EOT
    Id do modelo no bedrock-mantle. Estes ids não levam o prefixo de inference
    profile ("us.") nem o sufixo de versão (":0") que o InvokeModel quer:
    "openai.gpt-oss-120b-1:0" é 404 aqui. Anthropic e gpt-5.x são servidos pela
    Responses API e respondem 400 em /chat/completions. Liste o que a conta
    alcança de fato:
      curl https://bedrock-mantle.us-east-1.api.aws/v1/models \
        -H "Authorization: Bearer $AWS_BEARER_TOKEN_BEDROCK"
  EOT
  type        = string
  default     = "openai.gpt-oss-120b"
}

variable "openai_api_key" {
  description = "Bearer do provider OpenAI. Só lido quando llm_provider é openai."
  type        = string
  sensitive   = true
  default     = ""

  validation {
    # Falha no plan em vez de deixar o container em crashloop por chave ausente.
    condition     = var.llm_provider != "openai" || var.openai_api_key != ""
    error_message = "llm_provider = openai exige openai_api_key; apps/ai levanta no boot sem ela."
  }
}

variable "openai_model" {
  type    = string
  default = "gpt-5-mini"
}

variable "ai_system_prompt" {
  description = <<-EOT
    Prompt de sistema do serviço de IA. O padrão de `apps/ai` é genérico; este
    carrega as três amarras do produto, que não são estilo: o backend calcula e
    a IA traduz, ela só fala do conteúdo aprovado, e ela acolhe e encaminha sem
    investigar sentimento, aconselhar ou diagnosticar.
  EOT
  type        = string
  default     = <<-EOT
    Você atende trabalhadores em um app de saúde financeira e bem-estar, em
    português do Brasil, com frases curtas e sem jargão.

    O aplicativo calcula; você traduz. Use apenas os dados que a mensagem
    trouxer e o conteúdo educativo citado nela. Não invente número, fonte, nem
    ação concluída. Sem dado suficiente, diga que não sabe.

    Nunca diga quanto a pessoa deveria guardar ou gastar: quem define o valor é
    ela. Meta não cumprida não é falha — ofereça recalibrar, sem cobrança.

    Diante de sofrimento, acolha e encaminhe: reconheça em uma frase, ofereça
    pular a lição e lembre que existem canais de escuta, incluindo o CVV no 188.
    Não investigue o sentimento, não aconselhe sobre emoção e não diagnostique.
    Quem escolhe com quem falar é a pessoa.
  EOT
}

# -------------------------------------------------------------- semente
variable "seed_demo_data" {
  description = <<-EOT
    Roda `prisma db seed` depois das migrations. Ligado de propósito: a semente
    grava o catálogo de peças do COOPS, seis pessoas com histórico na unidade do
    pitch e quatro na vizinha — é ela que faz o painel do gestor ter número para
    mostrar e a unidade pequena aparecer suprimida. Ela é idempotente, então
    rodar de novo em cada deploy não duplica nada.

    Os dados são fictícios por construção: os e-mails usam `demo.invalid` e
    essas pessoas não têm senha utilizável.
  EOT
  type        = bool
  default     = true
}

variable "seed_admin_email" {
  type    = string
  default = "admin@backend.com.br"
}

variable "seed_admin_password" {
  description = "Senha do gestor da demonstração. Vai para o SSM como SecureString."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.seed_admin_password) >= 12
    error_message = "seed_admin_password precisa de pelo menos 12 caracteres."
  }
}

variable "seed_worker_email" {
  description = <<-EOT
    A pessoa do pitch. O histórico sintético é anexado a este e-mail, e é com
    ela que se demonstra a visão do trabalhador — e o isolamento: o gestor da
    mesma empresa não vê humor, meta nem resposta dela.
  EOT
  type        = string
  default     = "colaborador@backend.com.br"
}

variable "seed_worker_password" {
  type      = string
  sensitive = true

  validation {
    condition     = length(var.seed_worker_password) >= 12
    error_message = "seed_worker_password precisa de pelo menos 12 caracteres."
  }
}

variable "seed_company_name" {
  type    = string
  default = "Unidade Norte (demonstração)"
}

variable "seed_company_slug" {
  type    = string
  default = "unidade-norte-demo"
}

# -------------------------------------------------------- janela da jornada
# A janela de verdade é da unidade e vem do banco desde a #76. Estes valores são
# o fallback que vale para empresa sem faixa cadastrada — que é o caso da
# empresa recém-semeada.
#
# Sete dias, 00:00 às 23:59, e de propósito: o padrão do código é segunda a
# sexta, 07:30 às 18:00, e a apresentação é num domingo. Com o padrão, a diária
# apareceria fechada no palco — comportamento certo, demonstração errada.
variable "journey_window_zone" {
  type    = string
  default = "America/Cuiaba"
}

variable "journey_window_days" {
  description = "Dias da semana abertos, 0 é domingo."
  type        = string
  default     = "0,1,2,3,4,5,6"
}

variable "journey_window_opens" {
  type    = string
  default = "00:00"
}

variable "journey_window_closes" {
  type    = string
  default = "23:59"
}

variable "throttle_limit" {
  description = <<-EOT
    Requisições por janela do throttler do Nest. O padrão de 30 vale para
    internet aberta; aqui o navegador chega pelo rewrite `/api/*` do Next, então
    toda a plateia divide um balde só — `req.ip` é sempre 127.0.0.1. Com 30, a
    segunda pessoa a abrir o app durante a banca toma 429.
  EOT
  type        = number
  default     = 600
}
