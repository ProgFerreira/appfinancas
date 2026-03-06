-- Módulo Documentos: armazenamento de arquivos com permissões por documento (visualizar, baixar, editar, excluir)
USE transportadora_financeiro;

CREATE TABLE IF NOT EXISTS documentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL COMMENT 'Nome de exibição',
    nome_arquivo VARCHAR(255) NOT NULL COMMENT 'Nome original do arquivo',
    caminho VARCHAR(512) NOT NULL COMMENT 'Caminho no armazenamento (storage/documents/...)',
    mime_type VARCHAR(120) DEFAULT NULL,
    tamanho BIGINT UNSIGNED DEFAULT 0 COMMENT 'Tamanho em bytes',
    descricao TEXT DEFAULT NULL,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_documentos_created_by (created_by),
    INDEX idx_documentos_deleted_at (deleted_at),
    CONSTRAINT fk_documentos_created_by FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissões por documento: por usuário (can_view, can_download, can_edit, can_delete)
-- O dono (created_by) deve ter uma linha aqui com todos 1, ou ser tratado como dono na aplicação
CREATE TABLE IF NOT EXISTS document_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    user_id INT NOT NULL,
    can_view TINYINT(1) NOT NULL DEFAULT 1,
    can_download TINYINT(1) NOT NULL DEFAULT 0,
    can_edit TINYINT(1) NOT NULL DEFAULT 0,
    can_delete TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_doc_perm_document_user (document_id, user_id),
    INDEX idx_doc_perm_user (user_id),
    CONSTRAINT fk_doc_perm_document FOREIGN KEY (document_id) REFERENCES documentos(id) ON DELETE CASCADE,
    CONSTRAINT fk_doc_perm_user FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO permissions (code, nome, descricao) VALUES
('documentos.view', 'Documentos', 'Acessar o módulo de documentos (lista e upload)')
ON DUPLICATE KEY UPDATE nome = VALUES(nome), descricao = VALUES(descricao);
