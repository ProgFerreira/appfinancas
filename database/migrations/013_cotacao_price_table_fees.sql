-- Taxas por trecho (tabela de preço): um registro por trecho, espelhando os campos de partner_fees.
-- Na cotação: usa taxas do trecho se existirem; senão usa taxas do parceiro.

USE transportadora_financeiro;

CREATE TABLE IF NOT EXISTS cotacao_price_table_fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    price_table_id INT NOT NULL,
    gris_percent DECIMAL(5,4) DEFAULT NULL,
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
    prazo_rodoviario_dias INT DEFAULT NULL,
    prazo_aereo_dias INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cptf_price_table (price_table_id),
    CONSTRAINT fk_cptf_price_table FOREIGN KEY (price_table_id) REFERENCES cotacao_price_tables(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
