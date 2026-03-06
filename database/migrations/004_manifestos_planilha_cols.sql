-- Colunas adicionais da planilha manifesto.xls
-- Se der erro #1060 (coluna duplicada), comente ou remova a linha dessa coluna e execute o restante.
USE transportadora_financeiro;

-- ALTER TABLE manifestos ADD COLUMN data_saida_efetiva DATE DEFAULT NULL AFTER data_manifesto;
-- ALTER TABLE manifestos ADD COLUMN entrega_realizada INT DEFAULT NULL AFTER quantidade_entrega;
-- ALTER TABLE manifestos ADD COLUMN total_nf DECIMAL(15,2) DEFAULT NULL AFTER valor_liquido;
ALTER TABLE manifestos ADD COLUMN rota VARCHAR(150) DEFAULT NULL AFTER tipo_servico;
ALTER TABLE manifestos ADD COLUMN responsavel VARCHAR(150) DEFAULT NULL AFTER rota;
ALTER TABLE manifestos ADD COLUMN emissor VARCHAR(100) DEFAULT NULL AFTER status;
ALTER TABLE manifestos ADD COLUMN tipo_rodado VARCHAR(50) DEFAULT NULL AFTER emissor;
ALTER TABLE manifestos ADD COLUMN unidade VARCHAR(50) DEFAULT NULL AFTER tipo_rodado;
