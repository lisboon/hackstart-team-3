-- Distingue humor declarado pela pessoa do humor neutro automático, gravado
-- quando a colheita é respondida antes de a pessoa dizer como está.
-- As linhas existentes eram todas declaradas: default true cobre a migração.
ALTER TABLE "daily_entries" ADD COLUMN "mood_declared" BOOLEAN NOT NULL DEFAULT true;
