-- Migration: Manifestos module (reference: financial PHP app)
-- Run against transportadora_financeiro database.
-- Apenas cria a tabela manifestos. Colunas extras em motoristas (cnpj_cpf, placa, tipo) e a FK
-- estão no schema principal (database/schema.sql). Se o seu motoristas não tiver essas colunas,
-- execute manualmente (uma vez) os ALTERs comentados no final deste arquivo.

USE transportadora_financeiro;

-- Create manifestos table (sem FK para funcionar mesmo se motoristas não existir ainda)
CREATE TABLE IF NOT EXISTS manifestos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_manifesto VARCHAR(50) NOT NULL,
    motorista_id INT DEFAULT NULL,
    data_manifesto DATE DEFAULT NULL,
    origem VARCHAR(150) DEFAULT NULL,
    destino VARCHAR(150) DEFAULT NULL,
    cliente VARCHAR(150) DEFAULT NULL,
    valor_frete DECIMAL(15,2) DEFAULT 0.00,
    valor_despesa DECIMAL(15,2) DEFAULT 0.00,
    valor_liquido DECIMAL(15,2) DEFAULT 0.00,
    custo_adicional DECIMAL(15,2) DEFAULT 0.00,
    custo_pedagio DECIMAL(15,2) DEFAULT 0.00,
    quantidade_volumes INT DEFAULT 0,
    quantidade_entrega INT DEFAULT 0,
    peso DECIMAL(10,3) DEFAULT 0.000,
    peso_taxa DECIMAL(10,3) DEFAULT 0.000,
    km DECIMAL(10,2) DEFAULT 0.00,
    tipo_carga VARCHAR(100) DEFAULT NULL,
    tipo_servico VARCHAR(100) DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'pendente',
    observacoes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT DEFAULT NULL,
    UNIQUE KEY uk_numero_manifesto (numero_manifesto),
    INDEX idx_manifestos_motorista (motorista_id),
    INDEX idx_manifestos_data (data_manifesto),
    INDEX idx_manifestos_tipo_servico (tipo_servico)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Opcional: se motoristas existir e NÃO tiver as colunas cnpj_cpf, placa, tipo, descomente e execute uma vez:
-- ALTER TABLE motoristas ADD COLUMN cnpj_cpf VARCHAR(20) DEFAULT NULL AFTER cpf;
-- ALTER TABLE motoristas ADD COLUMN placa VARCHAR(10) DEFAULT NULL AFTER cnpj_cpf;
-- ALTER TABLE motoristas ADD COLUMN tipo VARCHAR(50) DEFAULT NULL AFTER placa;
-- Opcional: adicionar FK (apenas se a tabela motoristas existir):
-- ALTER TABLE manifestos ADD CONSTRAINT fk_manifestos_motorista FOREIGN KEY (motorista_id) REFERENCES motoristas(id) ON DELETE SET NULL;
