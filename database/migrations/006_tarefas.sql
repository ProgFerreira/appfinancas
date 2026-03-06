-- Módulo Tarefas: tabela e permissão RBAC
USE transportadora_financeiro;

CREATE TABLE IF NOT EXISTS tarefas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT DEFAULT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente',
    prioridade VARCHAR(50) NOT NULL DEFAULT 'media',
    data_vencimento DATE DEFAULT NULL,
    responsavel_id INT DEFAULT NULL,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_tarefas_status (status),
    INDEX idx_tarefas_data_vencimento (data_vencimento),
    INDEX idx_tarefas_responsavel (responsavel_id),
    INDEX idx_tarefas_deleted_at (deleted_at),
    CONSTRAINT fk_tarefas_responsavel FOREIGN KEY (responsavel_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_tarefas_created_by FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO permissions (code, nome, descricao) VALUES
('tarefas.view', 'Tarefas', 'Visualizar e gerenciar tarefas')
ON DUPLICATE KEY UPDATE nome = VALUES(nome), descricao = VALUES(descricao);
