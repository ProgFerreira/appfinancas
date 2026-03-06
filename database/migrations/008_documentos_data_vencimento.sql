-- Adiciona data de vencimento aos documentos (opcional)
USE transportadora_financeiro;

ALTER TABLE documentos
  ADD COLUMN data_vencimento DATE NULL DEFAULT NULL COMMENT 'Data de vencimento do documento' AFTER descricao,
  ADD INDEX idx_documentos_data_vencimento (data_vencimento);
