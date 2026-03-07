-- Bancário: importação OFX e conciliação com pagamentos/recebimentos
USE transportadora_financeiro;

CREATE TABLE IF NOT EXISTS bank_statement_imports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bank_account_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    imported_at DATETIME NOT NULL,
    status ENUM('processing', 'done', 'error') NOT NULL DEFAULT 'processing',
    error_message TEXT DEFAULT NULL,
    user_id INT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bsi_bank_imported_at (bank_account_id, imported_at),
    INDEX idx_bsi_status (status),
    CONSTRAINT fk_bsi_bank_account FOREIGN KEY (bank_account_id) REFERENCES contas_bancarias(id),
    CONSTRAINT fk_bsi_user FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bank_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bank_statement_import_id INT NOT NULL,
    bank_account_id INT NOT NULL,
    fit_id VARCHAR(128) NOT NULL,
    posted_at DATE NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    type ENUM('debit', 'credit') NOT NULL,
    memo VARCHAR(255) DEFAULT NULL,
    payee VARCHAR(255) DEFAULT NULL,
    raw_json JSON DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_bt_account_fitid (bank_account_id, fit_id),
    INDEX idx_bt_account_posted (bank_account_id, posted_at, id),
    INDEX idx_bt_import (bank_statement_import_id),
    CONSTRAINT fk_bt_import FOREIGN KEY (bank_statement_import_id) REFERENCES bank_statement_imports(id) ON DELETE CASCADE,
    CONSTRAINT fk_bt_bank_account FOREIGN KEY (bank_account_id) REFERENCES contas_bancarias(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reconciliation_matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bank_transaction_id INT NOT NULL,
    payable_payment_id INT DEFAULT NULL,
    receivable_receipt_id INT DEFAULT NULL,
    status ENUM('suggested', 'confirmed', 'rejected', 'ignored') NOT NULL DEFAULT 'suggested',
    score DECIMAL(5,2) DEFAULT NULL,
    confirmed_at DATETIME DEFAULT NULL,
    confirmed_by INT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rm_bank_status (bank_transaction_id, status),
    INDEX idx_rm_status (status),
    INDEX idx_rm_payable_status (payable_payment_id, status),
    INDEX idx_rm_receivable_status (receivable_receipt_id, status),
    CONSTRAINT fk_rm_bank_transaction FOREIGN KEY (bank_transaction_id) REFERENCES bank_transactions(id) ON DELETE CASCADE,
    CONSTRAINT fk_rm_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE bank_statement_imports
  ADD COLUMN user_id INT DEFAULT NULL AFTER error_message;

ALTER TABLE bank_statement_imports
  ADD INDEX idx_bsi_bank_imported_at (bank_account_id, imported_at);

ALTER TABLE bank_statement_imports
  ADD INDEX idx_bsi_status (status);

ALTER TABLE bank_statement_imports
  ADD CONSTRAINT fk_bsi_bank_account FOREIGN KEY (bank_account_id) REFERENCES contas_bancarias(id);

ALTER TABLE bank_statement_imports
  ADD CONSTRAINT fk_bsi_user FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL;

ALTER TABLE bank_transactions
  ADD COLUMN raw_json JSON DEFAULT NULL AFTER payee;

ALTER TABLE bank_transactions
  ADD UNIQUE KEY uq_bt_account_fitid (bank_account_id, fit_id);

ALTER TABLE bank_transactions
  ADD INDEX idx_bt_account_posted (bank_account_id, posted_at, id);

ALTER TABLE bank_transactions
  ADD INDEX idx_bt_import (bank_statement_import_id);

ALTER TABLE bank_transactions
  ADD CONSTRAINT fk_bt_import FOREIGN KEY (bank_statement_import_id) REFERENCES bank_statement_imports(id) ON DELETE CASCADE;

ALTER TABLE bank_transactions
  ADD CONSTRAINT fk_bt_bank_account FOREIGN KEY (bank_account_id) REFERENCES contas_bancarias(id);

ALTER TABLE reconciliation_matches
  ADD COLUMN score DECIMAL(5,2) DEFAULT NULL AFTER status;

ALTER TABLE reconciliation_matches
  MODIFY COLUMN status ENUM('suggested', 'confirmed', 'rejected', 'ignored') NOT NULL DEFAULT 'suggested';

ALTER TABLE reconciliation_matches
  ADD COLUMN confirmed_at DATETIME DEFAULT NULL AFTER score;

ALTER TABLE reconciliation_matches
  ADD COLUMN confirmed_by INT DEFAULT NULL AFTER confirmed_at;

ALTER TABLE reconciliation_matches
  ADD INDEX idx_rm_bank_status (bank_transaction_id, status);

ALTER TABLE reconciliation_matches
  ADD INDEX idx_rm_status (status);

ALTER TABLE reconciliation_matches
  ADD INDEX idx_rm_payable_status (payable_payment_id, status);

ALTER TABLE reconciliation_matches
  ADD INDEX idx_rm_receivable_status (receivable_receipt_id, status);

ALTER TABLE reconciliation_matches
  ADD CONSTRAINT fk_rm_bank_transaction FOREIGN KEY (bank_transaction_id) REFERENCES bank_transactions(id) ON DELETE CASCADE;

ALTER TABLE reconciliation_matches
  ADD CONSTRAINT fk_rm_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES usuarios(id) ON DELETE SET NULL;
