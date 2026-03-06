-- Taxas por faixa/fração no cadastro do parceiro (conforme tela de referência).
-- 8.1 Peso por Fração; 11 Pedágio (faixa peso); 11.1 Pedágio por Fração;
-- 21 TRT por faixa valor frete; 22 TAS por faixa peso; 24 TDE por faixa valor; 24.1 TDE por peso.

USE transportadora_financeiro;

-- 8.1 Peso por Fração (uma linha por parceiro)
CREATE TABLE IF NOT EXISTS cotacao_fee_peso_fracao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    fracao_kg DECIMAL(12,3) DEFAULT 0,
    minimo_fixo DECIMAL(12,2) DEFAULT 0,
    peso_franquia_kg DECIMAL(12,3) DEFAULT 0,
    excedente_por_fracao DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_peso_fracao_partner (partner_id),
    CONSTRAINT fk_peso_fracao_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11 Pedágio por faixa de peso (N linhas por parceiro)
CREATE TABLE IF NOT EXISTS cotacao_fee_pedagio_faixas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    peso_inicial_kg DECIMAL(12,3) NOT NULL DEFAULT 0,
    peso_final_kg DECIMAL(12,3) NOT NULL DEFAULT 0,
    tarifa_minima DECIMAL(12,2) DEFAULT 0,
    peso_franquia_kg DECIMAL(12,3) DEFAULT 0,
    peso_excedente DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedagio_faixas_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE,
    INDEX idx_pedagio_partner (partner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11.1 Pedágio por Fração (uma linha por parceiro)
CREATE TABLE IF NOT EXISTS cotacao_fee_pedagio_fracao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    fracao_kg DECIMAL(12,3) DEFAULT 0,
    minimo_fixo DECIMAL(12,2) DEFAULT 0,
    peso_franquia_kg DECIMAL(12,3) DEFAULT 0,
    excedente_por_fracao DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_pedagio_fracao_partner (partner_id),
    CONSTRAINT fk_pedagio_fracao_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21 Taxa TRT por faixa de valor de frete (N linhas)
CREATE TABLE IF NOT EXISTS cotacao_fee_trt_faixas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    frete_inicial DECIMAL(14,2) NOT NULL DEFAULT 0,
    frete_final DECIMAL(14,2) NOT NULL DEFAULT 0,
    tarifa_minima DECIMAL(12,2) DEFAULT 0,
    frete_franquia DECIMAL(14,2) DEFAULT 0,
    frete_excedente DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_trt_faixas_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE,
    INDEX idx_trt_partner (partner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22 Taxa TAS por faixa de peso (N linhas)
CREATE TABLE IF NOT EXISTS cotacao_fee_tas_faixas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    peso_inicial_kg DECIMAL(12,3) NOT NULL DEFAULT 0,
    peso_final_kg DECIMAL(12,3) NOT NULL DEFAULT 0,
    tarifa_minima DECIMAL(12,2) DEFAULT 0,
    peso_franquia_kg DECIMAL(12,3) DEFAULT 0,
    peso_excedente DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tas_faixas_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE,
    INDEX idx_tas_partner (partner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24 Taxa TDE por faixa de valor de frete (N linhas)
CREATE TABLE IF NOT EXISTS cotacao_fee_tde_faixas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    frete_inicial DECIMAL(14,2) NOT NULL DEFAULT 0,
    frete_final DECIMAL(14,2) NOT NULL DEFAULT 0,
    tarifa_minima DECIMAL(12,2) DEFAULT 0,
    frete_franquia DECIMAL(14,2) DEFAULT 0,
    frete_excedente DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tde_faixas_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE,
    INDEX idx_tde_partner (partner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24.1 Taxa TDE por faixa de peso (N linhas)
CREATE TABLE IF NOT EXISTS cotacao_fee_tde_peso_faixas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    peso_inicial_kg DECIMAL(12,3) NOT NULL DEFAULT 0,
    peso_final_kg DECIMAL(12,3) NOT NULL DEFAULT 0,
    tarifa_minima DECIMAL(12,2) DEFAULT 0,
    peso_franquia_kg DECIMAL(12,3) DEFAULT 0,
    peso_excedente DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tde_peso_faixas_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE,
    INDEX idx_tde_peso_partner (partner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
