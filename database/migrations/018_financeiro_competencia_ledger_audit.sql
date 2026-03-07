-- Financeiro: competência + ledger + auditoria
USE transportadora_financeiro;

ALTER TABLE contas_pagar
  ADD COLUMN data_competencia DATE NULL DEFAULT NULL AFTER data_vencimento;

ALTER TABLE contas_pagar
  ADD INDEX idx_cp_data_competencia (data_competencia);

ALTER TABLE contas_receber
  ADD COLUMN data_competencia DATE NULL DEFAULT NULL AFTER data_vencimento;

ALTER TABLE contas_receber
  ADD INDEX idx_cr_data_competencia (data_competencia);

UPDATE contas_pagar
SET data_competencia = STR_TO_DATE(DATE_FORMAT(data_emissao, '%Y-%m-01'), '%Y-%m-%d')
WHERE data_competencia IS NULL AND data_emissao IS NOT NULL;

UPDATE contas_receber
SET data_competencia = STR_TO_DATE(DATE_FORMAT(data_emissao, '%Y-%m-01'), '%Y-%m-%d')
WHERE data_competencia IS NULL AND data_emissao IS NOT NULL;

CREATE TABLE IF NOT EXISTS ledger_entries (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    event_type VARCHAR(40) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id INT NOT NULL,
    account_type ENUM('bank', 'plano_contas') NOT NULL,
    account_id INT NOT NULL,
    debit DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    credit DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    competence_date DATE NOT NULL,
    occurred_at DATETIME NOT NULL,
    metadata_json JSON DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ledger_entity (entity_type, entity_id),
    INDEX idx_ledger_competence (competence_date),
    INDEX idx_ledger_account (account_type, account_id),
    INDEX idx_ledger_occurred_at (occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id INT DEFAULT NULL,
    old_values_json JSON DEFAULT NULL,
    new_values_json JSON DEFAULT NULL,
    ip VARCHAR(45) DEFAULT NULL,
    user_agent VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_created_at (created_at),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
