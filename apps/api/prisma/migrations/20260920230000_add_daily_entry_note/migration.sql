-- Texto livre e opcional que a pessoa escreve ao declarar o humor, para
-- especificar o que está sentindo (issue #91). Nullable: a nota é opcional e
-- as linhas existentes não têm nenhuma. Estritamente pessoal — nunca agregado
-- nem exposto ao painel do gestor.
ALTER TABLE "daily_entries" ADD COLUMN "note" TEXT;
