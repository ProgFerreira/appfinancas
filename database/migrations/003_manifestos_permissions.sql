-- Permissões para o módulo Manifestos
USE transportadora_financeiro;

INSERT INTO permissions (code, nome, descricao) VALUES
('manifestos.view', 'Manifestos', 'Visualizar listagem, análise, estatísticas e gráficos de manifestos'),
('manifestos.import', 'Importar manifestos', 'Importar planilha Excel/CSV de manifestos')
ON DUPLICATE KEY UPDATE nome = VALUES(nome), descricao = VALUES(descricao);
