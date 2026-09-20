-- Valor-alvo autodeclarado da meta, em centavos. Reverte a decisão "sem cifra"
-- da #63 (ver #71): a meta passa a ter valor em dinheiro. Autodeclarado, nunca
-- verificado contra saldo, e privado — nunca vai ao painel do gestor.
--
-- DEFAULT 0 cobre linhas pré-existentes na migração; a regra de > 0 é aplicada
-- na criação (validator), não no banco.
ALTER TABLE "savings_goals" ADD COLUMN "target_amount_cents" INTEGER NOT NULL DEFAULT 0;
