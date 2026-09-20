-- Feriado, ponto facultativo, recesso e parada de fábrica (#77). Até aqui a
-- janela olhava só dia da semana e hora: 7 de setembro cai numa terça, a
-- janela abria, o app pedia a diária e ninguém estava trabalhando. Pelo mesmo
-- argumento que sustenta a janela — art. 4º da CLT, tempo à disposição do
-- empregador — pedir a diária num feriado é pedir exatamente o que a janela
-- existe para não pedir.
--
-- Tabela mantida pela empresa, e não biblioteca de feriados: feriado
-- municipal e ponto facultativo não saem de biblioteca nenhuma com confiança,
-- e MT e PA não têm o mesmo calendário. Uma lista que a unidade mantém é
-- honesta sobre de quem é a decisão, e a mesma tabela serve ao recesso.

-- CreateTable
CREATE TABLE "company_journey_exceptions" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "company_journey_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_journey_exceptions_company_id_idx" ON "company_journey_exceptions"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_journey_exceptions_company_id_date_key" ON "company_journey_exceptions"("company_id", "date");

-- AddForeignKey
ALTER TABLE "company_journey_exceptions" ADD CONSTRAINT "company_journey_exceptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
