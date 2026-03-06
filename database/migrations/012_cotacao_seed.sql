-- Módulo Cotação de Frete: permissões + seed de exemplo
-- Execute após 011_cotacao_init.sql

USE transportadora_financeiro;

-- Permissões para o módulo Cotação
INSERT INTO permissions (code, nome, descricao) VALUES
('cotacao.view', 'Cotação de frete', 'Acesso à tela de cotação'),
('parceiros.view', 'Parceiros (cotação)', 'Cadastro de parceiros para cotação'),
('tabelas-preco-cotacao.view', 'Tabelas de preço (cotação)', 'Tabelas de preço por parceiro'),
('taxas-parceiro.view', 'Taxas por parceiro', 'Taxas e regras por parceiro')
ON DUPLICATE KEY UPDATE nome = VALUES(nome), descricao = VALUES(descricao);

-- Atribui as novas permissões ao perfil administrador (role_id = 1). Se seu admin tiver outro id, ajuste ou atribua pelo cadastro de perfis.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions WHERE code IN ('cotacao.view', 'parceiros.view', 'tabelas-preco-cotacao.view', 'taxas-parceiro.view');

-- Praças CEP (MVP: SP e RJ para teste)
INSERT INTO cep_pracas (cep_inicio, cep_fim, uf, cidade) VALUES
('01000000', '01999999', 'SP', 'São Paulo'),
('02000000', '02999999', 'SP', 'São Paulo'),
('20000000', '20999999', 'RJ', 'Rio de Janeiro'),
('21000000', '21999999', 'RJ', 'Rio de Janeiro')
ON DUPLICATE KEY UPDATE uf = VALUES(uf), cidade = VALUES(cidade);

-- Parceiro A (rodoviário)
INSERT INTO cotacao_parceiros (nome, tipo, cnpj, contato, email, telefone, ativo, observacoes) VALUES
('Transportadora Rodoviária A', 'RODOVIARIO', '00.000.000/0001-00', 'João', 'contato@roda.com', '(11) 3333-0000', 1, 'Atende SP-RJ'),
('Express Aéreo B', 'AEREO', '00.000.000/0002-00', 'Maria', 'contato@aereob.com', '(11) 3333-0001', 1, 'Atende SP-RJ');

-- Cobertura: ambos atendem SP e RJ (por UF/cidade)
SET @pid_roda = (SELECT id FROM cotacao_parceiros WHERE nome = 'Transportadora Rodoviária A' LIMIT 1);
SET @pid_aereo = (SELECT id FROM cotacao_parceiros WHERE nome = 'Express Aéreo B' LIMIT 1);

INSERT INTO cotacao_parceiro_coverages (partner_id, uf, cidade, cep_inicio, cep_fim) VALUES
(@pid_roda, 'SP', 'São Paulo', '01000000', '01999999'),
(@pid_roda, 'RJ', 'Rio de Janeiro', '20000000', '20999999'),
(@pid_aereo, 'SP', 'São Paulo', '01000000', '01999999'),
(@pid_aereo, 'RJ', 'Rio de Janeiro', '20000000', '20999999');

-- Taxas por parceiro: GRIS 0.8%, Ad Valorem 0.4%, pedágio 12, seguro min 10 e 0.2%
INSERT INTO cotacao_partner_fees (partner_id, gris_percent, advalorem_percent, pedagio_fixo, seguro_minimo, seguro_percent, coleta_fixo, entrega_fixo, fator_cubagem_rodoviario, fator_cubagem_aereo, peso_minimo_tarifavel_kg, arredondar_peso_cima) VALUES
(@pid_roda, 0.0080, 0.0040, 12.00, 10.00, 0.0020, NULL, NULL, 300, 166.70, NULL, 1),
(@pid_aereo, 0.0080, 0.0040, NULL, 10.00, 0.0020, NULL, NULL, 300, 166.70, NULL, 1);

-- Tabelas de preço: SP -> RJ para cada parceiro
INSERT INTO cotacao_price_tables (partner_id, nome, origem_uf, origem_cidade, destino_uf, destino_cidade, ativo) VALUES
(@pid_roda, 'SP - Rio de Janeiro', 'SP', 'São Paulo', 'RJ', 'Rio de Janeiro', 1),
(@pid_aereo, 'SP - Rio de Janeiro', 'SP', 'São Paulo', 'RJ', 'Rio de Janeiro', 1);

SET @pt_roda = (SELECT id FROM cotacao_price_tables WHERE partner_id = @pid_roda AND origem_uf = 'SP' AND destino_uf = 'RJ' LIMIT 1);
SET @pt_aereo = (SELECT id FROM cotacao_price_tables WHERE partner_id = @pid_aereo AND origem_uf = 'SP' AND destino_uf = 'RJ' LIMIT 1);

-- Faixas: 0-5kg, 5-10kg, 10-30kg
INSERT INTO cotacao_price_table_ranges (price_table_id, peso_inicial_kg, peso_final_kg, valor_base, valor_excedente_por_kg, prazo_dias) VALUES
(@pt_roda, 0, 5, 25.00, 2.00, 2),
(@pt_roda, 5, 10, 35.00, 1.80, 2),
(@pt_roda, 10, 30, 50.00, 1.50, 3),
(@pt_aereo, 0, 5, 40.00, 5.00, 1),
(@pt_aereo, 5, 10, 55.00, 4.50, 1),
(@pt_aereo, 10, 30, 80.00, 4.00, 1);
