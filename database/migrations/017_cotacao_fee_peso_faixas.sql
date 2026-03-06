-- 8. Faixas de peso (por parceiro): Peso inicial, Peso final, Tarifa mínima, Peso franquia, Peso excedente.
-- Substitui o uso de "8.1 Peso por Fração" pela tabela de faixas conforme tela de referência.

USE transportadora_financeiro;

CREATE TABLE IF NOT EXISTS cotacao_fee_peso_faixas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    peso_inicial_kg DECIMAL(12,3) NOT NULL DEFAULT 0,
    peso_final_kg DECIMAL(12,3) NOT NULL DEFAULT 0,
    tarifa_minima DECIMAL(12,2) DEFAULT 0,
    peso_franquia_kg DECIMAL(12,3) DEFAULT 0,
    peso_excedente DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_peso_faixas_partner FOREIGN KEY (partner_id) REFERENCES cotacao_parceiros(id) ON DELETE CASCADE,
    INDEX idx_peso_faixas_partner (partner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
