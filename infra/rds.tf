resource "random_password" "db" {
  length = 32
  # Sem caracteres especiais: a senha entra direto numa DSN, e errar o
  # percent-encoding ali é caro de depurar.
  special = false
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-db"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project}-db"
  engine         = "postgres"
  engine_version = "17"
  instance_class = var.db_instance_class

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = "colheita"
  username = "colheita"
  password = random_password.db.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = false
  multi_az               = false

  backup_retention_period    = 1
  auto_minor_version_upgrade = true
  apply_immediately          = true
  skip_final_snapshot        = true
  deletion_protection        = false
}

locals {
  # sslmode=require, não disable: Postgres 15+ no RDS vem com rds.force_ssl=1 no
  # parameter group padrão. O driver `pg` traduz esse parâmetro para TLS sem
  # verificação de CA, que é o que dispensa embutir o bundle da Amazon na
  # imagem. `schema=public` é o que o Prisma espera na URL.
  database_url = "postgresql://colheita:${random_password.db.result}@${aws_db_instance.main.address}:5432/colheita?schema=public&sslmode=require"
}
