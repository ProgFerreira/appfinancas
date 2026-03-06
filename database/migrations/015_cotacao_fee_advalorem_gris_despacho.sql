-- Taxas Advalorem (4, 4.1, 4.2), GRIS (5, 5.1) e Despacho (6, 6.1) por faixa de valor NF e faixa de peso.

USE transportadora_financeiro;

-- Faixa por valor NF: valor_inicial, valor_final, minimo_fixo, franquia_desconto, nf_excedente
CREATE TABLE IF NOT EXISTS cotacao_fee_advalorem_nf_faixas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    valor_inicial DECIMAL(14,2) NOT NULL DEFAULT 0,
    valor_final DECIMAL(14,2) NOT NULL DEFAULT 0,
    minimo_fixo DECIMAL(12,2) DEFAULT 0,
    franquia_desconto DECIMAL(12,2) DEFAULT 0,
    nf_excedente DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_advalorem_nf_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE,
    INDEX idx_advalorem_nf_partner (partner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.1 Advalorem por faixa de peso
CREATE TABLE IF NOT EXISTS cotacao_fee_advalorem_peso_faixas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    peso_inicial_kg DECIMAL(12,3) NOT NULL DEFAULT 0,
    peso_final_kg DECIMAL(12,3) NOT NULL DEFAULT 0,
    minimo_fixo DECIMAL(12,2) DEFAULT 0,
    peso_franquia_kg DECIMAL(12,3) DEFAULT 0,
    nf_excedente DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_advalorem_peso_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE,
    INDEX idx_advalorem_peso_partner (partner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.2 Advalorem Carga/Valor
CREATE TABLE IF NOT EXISTS cotacao_fee_advalorem_carga_faixas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    valor_inicial DECIMAL(14,2) NOT NULL DEFAULT 0,
    valor_final DECIMAL(14,2) NOT NULL DEFAULT 0,
    minimo_fixo DECIMAL(12,2) DEFAULT 0,
    franquia_desconto DECIMAL(12,2) DEFAULT 0,
    nf_excedente DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_advalorem_carga_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE,
    INDEX idx_advalorem_carga_partner (partner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5 GRIS por Valor NF
CREATE TABLE IF NOT EXISTS cotacao_fee_gris_nf_faixas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    valor_inicial DECIMAL(14,2) NOT NULL DEFAULT 0,
    valor_final DECIMAL(14,2) NOT NULL DEFAULT 0,
    minimo_fixo DECIMAL(12,2) DEFAULT 0,
    franquia_desconto DECIMAL(12,2) DEFAULT 0,
    nf_excedente DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_gris_nf_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE,
    INDEX idx_gris_nf_partner (partner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.1 GRIS por Faixa de Peso
CREATE TABLE IF NOT EXISTS cotacao_fee_gris_peso_faixas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    peso_inicial_kg DECIMAL(12,3) NOT NULL DEFAULT 0,
    peso_final_kg DECIMAL(12,3) NOT NULL DEFAULT 0,
    minimo_fixo DECIMAL(12,2) DEFAULT 0,
    peso_franquia_kg DECIMAL(12,3) DEFAULT 0,
    nf_excedente DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_gris_peso_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE,
    INDEX idx_gris_peso_partner (partner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6 Despacho (por faixa de peso)
CREATE TABLE IF NOT EXISTS cotacao_fee_despacho_faixas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    peso_inicial_kg DECIMAL(12,3) NOT NULL DEFAULT 0,
    peso_final_kg DECIMAL(12,3) NOT NULL DEFAULT 0,
    tarifa_minima DECIMAL(12,2) DEFAULT 0,
    peso_franquia_kg DECIMAL(12,3) DEFAULT 0,
    peso_excedente DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_despacho_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE,
    INDEX idx_despacho_partner (partner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6.1 Despacho por faixa de valor de nota
CREATE TABLE IF NOT EXISTS cotacao_fee_despacho_nf_faixas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    valor_inicial DECIMAL(14,2) NOT NULL DEFAULT 0,
    valor_final DECIMAL(14,2) NOT NULL DEFAULT 0,
    tarifa_minima DECIMAL(12,2) DEFAULT 0,
    franquia_desconto DECIMAL(12,2) DEFAULT 0,
    nf_excedente DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_despacho_nf_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE,
    INDEX idx_despacho_nf_partner (partner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
