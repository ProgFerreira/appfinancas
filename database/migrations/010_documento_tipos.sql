-- Tipos de documento para classificação (contrato, nota fiscal, etc.)
USE transportadora_financeiro;

CREATE TABLE IF NOT EXISTS documento_tipos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    ordem INT NOT NULL DEFAULT 0,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_documento_tipos_nome (nome),
    INDEX idx_documento_tipos_ativo_ordem (ativo, ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Coluna tipo_documento_id em documentos
ALTER TABLE documentos
    ADD COLUMN tipo_documento_id INT DEFAULT NULL AFTER descricao;

ALTER TABLE documentos
    ADD INDEX idx_documentos_tipo (tipo_documento_id);

ALTER TABLE documentos
    ADD CONSTRAINT fk_documentos_tipo FOREIGN KEY (tipo_documento_id) REFERENCES documento_tipos(id) ON DELETE SET NULL;

-- Tipos padrão
INSERT INTO documento_tipos (nome, ordem) VALUES
    ('Contrato', 1),
    ('Nota fiscal', 2),
    ('Comprovante', 3),
    ('Relatório', 4),
    ('Outros', 5)
ON DUPLICATE KEY UPDATE nome = VALUES(nome), ordem = VALUES(ordem);
