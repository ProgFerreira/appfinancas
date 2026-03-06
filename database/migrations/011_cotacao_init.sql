-- Módulo Cotação de Frete: tabelas iniciais
-- Parceiros, cobertura (praças), tabelas de preço, faixas, taxas, quotes e seleções.
-- Execute após as migrations existentes (001..010).

USE transportadora_financeiro;

-- Parceiros (transportadoras / cias aéreas)
CREATE TABLE IF NOT EXISTS cotacao_parceiros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    tipo ENUM('RODOVIARIO', 'AEREO', 'AMBOS') NOT NULL DEFAULT 'RODOVIARIO',
    cnpj VARCHAR(18) DEFAULT NULL,
    contato VARCHAR(150) DEFAULT NULL,
    email VARCHAR(150) DEFAULT NULL,
    telefone VARCHAR(30) DEFAULT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    observacoes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_cotacao_parceiros_ativo (ativo),
    INDEX idx_cotacao_parceiros_tipo (tipo),
    INDEX idx_cotacao_parceiros_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cobertura: praças atendidas por parceiro (UF/cidade e opcional faixa CEP)
CREATE TABLE IF NOT EXISTS cotacao_parceiro_coverages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    uf CHAR(2) NOT NULL,
    cidade VARCHAR(120) NOT NULL,
    cep_inicio VARCHAR(8) DEFAULT NULL,
    cep_fim VARCHAR(8) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cov_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE,
    INDEX idx_cov_partner (partner_id),
    INDEX idx_cov_uf_cidade (uf, cidade),
    INDEX idx_cov_cep (cep_inicio, cep_fim)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabelas de preço por parceiro (cabeça da tabela: origem -> destino)
CREATE TABLE IF NOT EXISTS cotacao_price_tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    nome VARCHAR(120) NOT NULL,
    origem_uf CHAR(2) NOT NULL,
    origem_cidade VARCHAR(120) NOT NULL,
    destino_uf CHAR(2) NOT NULL,
    destino_cidade VARCHAR(120) NOT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_pt_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE,
    INDEX idx_pt_partner (partner_id),
    INDEX idx_pt_route (origem_uf, origem_cidade, destino_uf, destino_cidade),
    INDEX idx_pt_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Faixas de peso por tabela de preço
CREATE TABLE IF NOT EXISTS cotacao_price_table_ranges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    price_table_id INT NOT NULL,
    peso_inicial_kg DECIMAL(10,3) NOT NULL DEFAULT 0,
    peso_final_kg DECIMAL(10,3) NOT NULL,
    valor_base DECIMAL(12,2) NOT NULL DEFAULT 0,
    valor_excedente_por_kg DECIMAL(10,4) DEFAULT NULL,
    prazo_dias INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ptr_price_table FOREIGN KEY (price_table_id) REFERENCES cotacao_price_tables(id) ON DELETE CASCADE,
    INDEX idx_ptr_price_table (price_table_id),
    INDEX idx_ptr_peso (peso_inicial_kg, peso_final_kg)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Taxas e regras por parceiro (GRIS, Ad Valorem, pedágio, seguro, coleta/entrega, cubagem, etc.)
CREATE TABLE IF NOT EXISTS cotacao_partner_fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    gris_percent DECIMAL(5,4) DEFAULT NULL COMMENT '% sobre valor NF',
    advalorem_percent DECIMAL(5,4) DEFAULT NULL,
    tde_fixo DECIMAL(10,2) DEFAULT NULL,
    tde_percent DECIMAL(5,4) DEFAULT NULL,
    trt_fixo DECIMAL(10,2) DEFAULT NULL,
    tda_fixo DECIMAL(10,2) DEFAULT NULL,
    pedagio_fixo DECIMAL(10,2) DEFAULT NULL,
    seguro_minimo DECIMAL(10,2) DEFAULT NULL,
    seguro_percent DECIMAL(5,4) DEFAULT NULL,
    coleta_fixo DECIMAL(10,2) DEFAULT NULL,
    entrega_fixo DECIMAL(10,2) DEFAULT NULL,
    fator_cubagem_rodoviario INT DEFAULT 300,
    fator_cubagem_aereo DECIMAL(8,2) DEFAULT 166.70,
    peso_minimo_tarifavel_kg DECIMAL(10,3) DEFAULT NULL,
    arredondar_peso_cima TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cpf_partner (partner_id),
    CONSTRAINT fk_cpf_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lookup CEP -> praça (UF/cidade) para cotação (MVP: dados manuais ou importados)
CREATE TABLE IF NOT EXISTS cep_pracas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cep_inicio VARCHAR(8) NOT NULL,
    cep_fim VARCHAR(8) NOT NULL,
    uf CHAR(2) NOT NULL,
    cidade VARCHAR(120) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cep_range (cep_inicio, cep_fim),
    INDEX idx_cep_uf_cidade (uf, cidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cotação (cabeça): dados do form (origem, destino, valor NF, serviços, etc.)
CREATE TABLE IF NOT EXISTS cotacao_quotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    origem_cep VARCHAR(8) NOT NULL,
    destino_cep VARCHAR(8) NOT NULL,
    origem_uf CHAR(2) DEFAULT NULL,
    origem_cidade VARCHAR(120) DEFAULT NULL,
    destino_uf CHAR(2) DEFAULT NULL,
    destino_cidade VARCHAR(120) DEFAULT NULL,
    tipo_carga VARCHAR(80) DEFAULT NULL,
    valor_nf DECIMAL(12,2) NOT NULL DEFAULT 0,
    peso_real_kg DECIMAL(10,3) NOT NULL DEFAULT 0,
    peso_cubado_kg DECIMAL(10,3) NOT NULL DEFAULT 0,
    peso_tarifavel_kg DECIMAL(10,3) NOT NULL DEFAULT 0,
    servico_ar TINYINT(1) NOT NULL DEFAULT 0,
    servico_mao_propria TINYINT(1) NOT NULL DEFAULT 0,
    servico_coleta TINYINT(1) NOT NULL DEFAULT 0,
    servico_entrega TINYINT(1) NOT NULL DEFAULT 0,
    servico_seguro TINYINT(1) NOT NULL DEFAULT 0,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cq_origem_destino (origem_cep, destino_cep),
    INDEX idx_cq_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volumes da cotação
CREATE TABLE IF NOT EXISTS cotacao_quote_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_id INT NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    altura_cm DECIMAL(8,2) NOT NULL DEFAULT 0,
    largura_cm DECIMAL(8,2) NOT NULL DEFAULT 0,
    comprimento_cm DECIMAL(8,2) NOT NULL DEFAULT 0,
    peso_kg DECIMAL(10,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cqi_quote FOREIGN KEY (quote_id) REFERENCES cotacao_quotes(id) ON DELETE CASCADE,
    INDEX idx_cqi_quote (quote_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seleção do cliente: qual opção foi escolhida (depois vira OT/operação)
CREATE TABLE IF NOT EXISTS cotacao_quote_selections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_id INT NOT NULL,
    partner_id INT NOT NULL,
    preco_final DECIMAL(12,2) NOT NULL,
    prazo_dias INT NOT NULL DEFAULT 1,
    breakdown_json JSON DEFAULT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'selecionada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cqs_quote FOREIGN KEY (quote_id) REFERENCES cotacao_quotes(id) ON DELETE CASCADE,
    CONSTRAINT fk_cqs_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE,
    INDEX idx_cqs_quote (quote_id),
    INDEX idx_cqs_partner (partner_id),
    INDEX idx_cqs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
