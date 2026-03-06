-- Custo total da planilha (valor exato para bater na análise).
-- Se der #1060 (coluna duplicada), esta coluna já existe; pode ignorar.
-- Depois de rodar, reimporte a planilha para preencher custo_total a partir da coluna CUSTO TOTAL.
USE transportadora_financeiro;

ALTER TABLE manifestos ADD COLUMN custo_total DECIMAL(15,2) DEFAULT NULL AFTER custo_pedagio;
