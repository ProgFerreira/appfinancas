-- Taxas adicionais por parceiro: Generalidades, Reentrega, Devolução, Margem,
-- Tarifa aérea mínima, Percentuais, Desconto/acréscimo.
-- Tarifas específicas TE em tabela separada (N linhas por parceiro).
-- Execute uma vez; se as colunas já existirem, ignorar ou comentar os ADD.

USE transportadora_financeiro;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN lib_suframa DECIMAL(12,2) DEFAULT 0 AFTER arredondar_peso_cima;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN minimo_trecho DECIMAL(12,2) DEFAULT 0 AFTER lib_suframa;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN tde_geral DECIMAL(12,2) DEFAULT 0 AFTER minimo_trecho;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN reentrega_percent DECIMAL(5,2) DEFAULT 0 AFTER tde_geral;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN reentrega_taxa_fixa DECIMAL(12,2) DEFAULT 0 AFTER reentrega_percent;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN reentrega_minima DECIMAL(12,2) DEFAULT 0 AFTER reentrega_taxa_fixa;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN reentrega_soma_icms TINYINT(1) NOT NULL DEFAULT 0 AFTER reentrega_minima;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN devolucao_percent DECIMAL(5,2) DEFAULT 0 AFTER reentrega_soma_icms;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN devolucao_taxa_fixa DECIMAL(12,2) DEFAULT 0 AFTER devolucao_percent;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN devolucao_minima DECIMAL(12,2) DEFAULT 0 AFTER devolucao_taxa_fixa;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN devolucao_soma_icms TINYINT(1) NOT NULL DEFAULT 0 AFTER devolucao_minima;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN margem_rodoviario DECIMAL(5,2) DEFAULT 0 AFTER devolucao_soma_icms;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN margem_aereo DECIMAL(5,2) DEFAULT 0 AFTER margem_rodoviario;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN margem_base_cte VARCHAR(40) DEFAULT 'frete_total' AFTER margem_aereo;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN tarifa_aerea_minima DECIMAL(12,2) DEFAULT 0 AFTER margem_base_cte;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN tarifa_aerea_taxa_extra DECIMAL(12,2) DEFAULT 0 AFTER tarifa_aerea_minima;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN tarifa_aerea_tad DECIMAL(12,2) DEFAULT 0 AFTER tarifa_aerea_taxa_extra;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN tarifa_aerea_soma_minimo TINYINT(1) NOT NULL DEFAULT 1 AFTER tarifa_aerea_tad;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN percentual_frete DECIMAL(5,2) DEFAULT 0 AFTER tarifa_aerea_soma_minimo;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN percentual_pedagio_frete DECIMAL(5,2) DEFAULT 0 AFTER percentual_frete;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN desconto_max_percent DECIMAL(5,2) DEFAULT 0 AFTER percentual_pedagio_frete;

ALTER TABLE cotacao_partner_fees
  ADD COLUMN acrescimo_max_percent DECIMAL(5,2) DEFAULT 0 AFTER desconto_max_percent;

CREATE TABLE IF NOT EXISTS cotacao_partner_te (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    codigo VARCHAR(20) DEFAULT NULL,
    minima DECIMAL(12,2) DEFAULT 0,
    peso_franquia_kg DECIMAL(12,3) DEFAULT 0,
    tarifa DECIMAL(12,2) DEFAULT 0,
    soma_ao_frete_peso TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_partner_te_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE,
    INDEX idx_partner_te_partner (partner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
