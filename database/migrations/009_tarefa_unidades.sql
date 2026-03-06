-- Tipos de unidade para tarefas (empresa, pessoal, ministerio, familia, etc.)
USE transportadora_financeiro;

CREATE TABLE IF NOT EXISTS tarefa_unidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    ordem INT NOT NULL DEFAULT 0,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tarefa_unidades_nome (nome),
    INDEX idx_tarefa_unidades_ativo_ordem (ativo, ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Coluna unidade_id em tarefas
ALTER TABLE tarefas
    ADD COLUMN unidade_id INT DEFAULT NULL AFTER prioridade,
    ADD INDEX idx_tarefas_unidade (unidade_id),
    ADD CONSTRAINT fk_tarefas_unidade FOREIGN KEY (unidade_id) REFERENCES tarefa_unidades(id) ON DELETE SET NULL;

-- Tipos padrão (empresa, pessoal, ministerio, familia)
INSERT INTO tarefa_unidades (nome, ordem) VALUES
    ('Empresa', 1),
    ('Pessoal', 2),
    ('Ministério', 3),
    ('Família', 4)
ON DUPLICATE KEY UPDATE nome = VALUES(nome), ordem = VALUES(ordem);
