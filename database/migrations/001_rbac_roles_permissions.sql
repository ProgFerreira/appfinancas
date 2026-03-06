-- RBAC: perfis (roles) e permissões por tela
-- Permite controlar acesso às telas por perfil e associar usuários a perfis.

USE transportadora_financeiro;

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    descricao VARCHAR(255) DEFAULT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_roles_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(80) NOT NULL,
    nome VARCHAR(120) NOT NULL,
    descricao VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_permissions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissões: uma por tela/módulo (code = identificador único usado no rbac.ts)
INSERT INTO permissions (code, nome, descricao) VALUES
('dashboard.view', 'Dashboard', 'Acesso à tela inicial'),
('contas-pagar.view', 'Contas a Pagar', 'Visualizar e gerenciar contas a pagar'),
('contas-receber.view', 'Contas a Receber', 'Visualizar e gerenciar contas a receber'),
('contas-receber-ctes.view', 'Contas a receber × CTe', 'Vincular contas a receber a CTe'),
('despesas-fixas.view', 'Despesas fixas', 'Cadastro de despesas fixas'),
('ctes.view', 'CTe', 'Visualizar e gerenciar CTe'),
('contas-bancarias.view', 'Contas bancárias', 'Cadastro de contas bancárias'),
('bank.view', 'Bancário (extrato/transações)', 'Ver extrato e transações bancárias'),
('bank.import', 'Importar OFX', 'Importar arquivo OFX'),
('conciliacao-bancaria.view', 'Conciliação bancária', 'Acesso à conciliação bancária'),
('reconciliation.view', 'Conciliação (sugestões)', 'Ver e gerenciar sugestões de conciliação'),
('reconciliation.confirm', 'Confirmar conciliação', 'Confirmar/rejeitar/ignorar conciliação'),
('movimentacoes.view', 'Movimentações', 'Relatório de movimentações'),
('fluxo-caixa.view', 'Fluxo de caixa', 'Relatório de fluxo de caixa'),
('dre.view', 'DRE', 'Relatório DRE'),
('clientes.view', 'Clientes', 'Cadastro de clientes'),
('categorias-despesa.view', 'Categorias despesa', 'Cadastro de categorias de despesa'),
('categorias-receita.view', 'Categorias receita', 'Cadastro de categorias de receita'),
('centros-custo.view', 'Centros de custo', 'Cadastro de centros de custo'),
('naturezas.view', 'Naturezas', 'Cadastro de naturezas'),
('plano-contas.view', 'Plano de contas', 'Cadastro do plano de contas'),
('tabelas-frete.view', 'Tabelas de frete', 'Cadastro de tabelas de frete'),
('motoristas.view', 'Motoristas', 'Cadastro de motoristas'),
('veiculos.view', 'Veículos', 'Cadastro de veículos'),
('despesas-viagem.view', 'Despesas de viagem', 'Cadastro de despesas de viagem'),
('usuarios.view', 'Usuários', 'Cadastro de usuários'),
('perfis.view', 'Perfis', 'Gerenciar perfis e acessos por tela')
ON DUPLICATE KEY UPDATE nome = VALUES(nome), descricao = VALUES(descricao);
