SET FOREIGN_KEY_CHECKS=0;

CREATE DATABASE IF NOT EXISTS transportadora_financeiro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE transportadora_financeiro;

CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_receita_id INT DEFAULT NULL,
    categoria_despesa_id INT DEFAULT NULL,
    plano_contas_id INT DEFAULT NULL,
    plano_contas_despesa_id INT DEFAULT NULL,
    centro_custo_id INT DEFAULT NULL,
    nome VARCHAR(150) NOT NULL,
    razao_social VARCHAR(150) DEFAULT NULL,
    cnpj_cpf VARCHAR(20) DEFAULT NULL,
    inscricao_estadual VARCHAR(30) DEFAULT NULL,
    tipo_cadastro ENUM('cliente', 'fornecedor', 'funcionario', 'parceiro', 'empresa', 'outros') NOT NULL DEFAULT 'cliente',
    tipo_parceiro VARCHAR(30) DEFAULT NULL,
    condicao_pagamento VARCHAR(50) DEFAULT NULL,
    dados_bancarios TEXT DEFAULT NULL,
    prazo_pagamento INT DEFAULT 30,
    tipo_cobranca VARCHAR(30) DEFAULT 'boleto',
    pode_faturar TINYINT(1) NOT NULL DEFAULT 1,
    classificacao ENUM('A', 'B', 'C') DEFAULT NULL,
    contato VARCHAR(120) DEFAULT NULL,
    telefone VARCHAR(20) DEFAULT NULL,
    telefone_xml VARCHAR(20) DEFAULT NULL,
    logradouro VARCHAR(150) DEFAULT NULL,
    numero VARCHAR(20) DEFAULT NULL,
    complemento VARCHAR(100) DEFAULT NULL,
    bairro VARCHAR(100) DEFAULT NULL,
    codigo_municipio INT DEFAULT NULL,
    municipio VARCHAR(100) DEFAULT NULL,
    cep VARCHAR(10) DEFAULT NULL,
    uf CHAR(2) DEFAULT NULL,
    codigo_pais INT DEFAULT NULL,
    pais VARCHAR(60) DEFAULT NULL,
    email VARCHAR(120) DEFAULT NULL,
    observacoes TEXT DEFAULT NULL,
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_clientes_categoria_receita FOREIGN KEY (categoria_receita_id) REFERENCES categorias_receita(id),
    CONSTRAINT fk_clientes_categoria_despesa FOREIGN KEY (categoria_despesa_id) REFERENCES categorias_despesa(id) ON DELETE SET NULL,
    CONSTRAINT fk_clientes_plano_contas FOREIGN KEY (plano_contas_id) REFERENCES plano_contas(id) ON DELETE SET NULL,
    CONSTRAINT fk_clientes_plano_contas_despesa FOREIGN KEY (plano_contas_despesa_id) REFERENCES plano_contas(id) ON DELETE SET NULL,
    CONSTRAINT fk_clientes_centro_custo FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id)
);

CREATE TABLE IF NOT EXISTS cliente_categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    categoria ENUM('cliente', 'fornecedor', 'funcionario', 'parceiro', 'empresa', 'outros') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cliente_categorias_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    CONSTRAINT unq_cliente_categoria UNIQUE (cliente_id, categoria)
);

CREATE TABLE IF NOT EXISTS cliente_contatos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    tipo ENUM('financeiro', 'comercial', 'outros') NOT NULL DEFAULT 'comercial',
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(20) DEFAULT NULL,
    whatsapp VARCHAR(20) DEFAULT NULL,
    email VARCHAR(120) DEFAULT NULL,
    observacoes TEXT DEFAULT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cliente_contatos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    INDEX idx_cliente_contatos_cliente (cliente_id),
    INDEX idx_cliente_contatos_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cliente_dados_bancarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    favorecido VARCHAR(150) NOT NULL,
    cnpj_cpf VARCHAR(20) DEFAULT NULL,
    banco VARCHAR(100) NOT NULL,
    agencia VARCHAR(20) DEFAULT NULL,
    conta VARCHAR(20) DEFAULT NULL,
    operacao VARCHAR(10) DEFAULT NULL,
    pix VARCHAR(150) DEFAULT NULL,
    observacoes TEXT DEFAULT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cliente_dados_bancarios_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    INDEX idx_cliente_dados_bancarios_cliente (cliente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Naturezas: raiz da natureza (hierarquia própria). Usada para preencher centro de custo "pai" conceitual.
CREATE TABLE IF NOT EXISTS naturezas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NULL,
    nome VARCHAR(255) NOT NULL,
    natureza_pai_id INT NULL,
    tipo ENUM('ambos','receita','despesa') NOT NULL DEFAULT 'ambos',
    descricao TEXT NULL,
    nivel INT NOT NULL DEFAULT 1,
    ordem INT NOT NULL DEFAULT 0,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_naturezas_codigo (codigo),
    INDEX idx_naturezas_pai (natureza_pai_id),
    INDEX idx_naturezas_nome (nome),
    CONSTRAINT fk_natureza_pai FOREIGN KEY (natureza_pai_id) REFERENCES naturezas(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Centros de custo: cada um pertence a uma Natureza (raiz). Sem centro pai — um único conceito evita redundância.
CREATE TABLE IF NOT EXISTS centros_custo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NULL COMMENT 'COD',
    nome VARCHAR(255) NOT NULL COMMENT 'NOME DO CENTRO DE CUSTO',
    natureza_id INT NULL COMMENT 'Natureza (raiz) a que este centro pertence',
    natureza ENUM('ambos','receita','despesa') NOT NULL DEFAULT 'ambos' COMMENT 'TIPO: despesa=DEBITO, receita=CREDITO',
    plano_contas VARCHAR(50) NULL COMMENT 'PLANO DE CONTAS',
    descricao TEXT NULL,
    ordem INT NOT NULL DEFAULT 0,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_codigo (codigo),
    INDEX idx_centros_custo_natureza_id (natureza_id),
    INDEX idx_nome (nome),
    CONSTRAINT fk_centros_custo_natureza FOREIGN KEY (natureza_id) REFERENCES naturezas(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS motoristas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parceiro_id INT DEFAULT NULL,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(20) NOT NULL,
    cnpj_cpf VARCHAR(20) DEFAULT NULL,
    placa VARCHAR(10) DEFAULT NULL,
    tipo VARCHAR(50) DEFAULT NULL,
    telefone VARCHAR(20) DEFAULT NULL,
    email VARCHAR(120) DEFAULT NULL,
    tipo_vinculo VARCHAR(30) NOT NULL,
    observacoes TEXT DEFAULT NULL,
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_motoristas_parceiro FOREIGN KEY (parceiro_id) REFERENCES clientes(id)
);

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
    INDEX idx_manifestos_tipo_servico (tipo_servico),
    CONSTRAINT fk_manifestos_motorista FOREIGN KEY (motorista_id) REFERENCES motoristas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS veiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    placa VARCHAR(10) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    ano INT DEFAULT NULL,
    proprietario_tipo VARCHAR(20) DEFAULT 'empresa',
    proprietario_id INT DEFAULT NULL,
    renavam VARCHAR(15) DEFAULT NULL,
    capacidade DECIMAL(12,2) DEFAULT NULL,
    observacoes TEXT DEFAULT NULL,
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categorias_despesa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plano_contas_id INT NOT NULL,
    nome VARCHAR(120) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    descricao TEXT DEFAULT NULL,
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_categorias_despesa_plano_contas FOREIGN KEY (plano_contas_id) REFERENCES plano_contas(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_categorias_despesa_plano_contas (plano_contas_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categorias_receita (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plano_contas_id INT NOT NULL,
    nome VARCHAR(120) NOT NULL,
    descricao TEXT DEFAULT NULL,
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_categorias_receita_plano_contas FOREIGN KEY (plano_contas_id) REFERENCES plano_contas(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_categorias_receita_plano_contas (plano_contas_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS plano_contas_classificacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL,
    nome VARCHAR(80) NOT NULL,
    slug VARCHAR(40) NOT NULL UNIQUE,
    descricao TEXT DEFAULT NULL,
    padrao TINYINT(1) NOT NULL DEFAULT 0,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS plano_contas_naturezas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL,
    nome VARCHAR(80) NOT NULL,
    slug VARCHAR(40) NOT NULL UNIQUE,
    descricao TEXT DEFAULT NULL,
    padrao TINYINT(1) NOT NULL DEFAULT 0,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS plano_contas_grupos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL,
    nome VARCHAR(80) NOT NULL,
    slug VARCHAR(40) NOT NULL UNIQUE,
    classificacao_id INT NOT NULL,
    descricao TEXT DEFAULT NULL,
    padrao TINYINT(1) NOT NULL DEFAULT 0,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_plano_grupo_classificacao FOREIGN KEY (classificacao_id) REFERENCES plano_contas_classificacoes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS plano_contas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT DEFAULT NULL,
    plano_pai_id INT DEFAULT NULL,
    tipo_conta ENUM('sintetica', 'analitica') NOT NULL DEFAULT 'analitica',
    classificacao_id INT NOT NULL,
    grupo_dre_id INT NOT NULL,
    natureza_fluxo_id INT NOT NULL,
    eh_receita TINYINT(1) NOT NULL DEFAULT 0,
    eh_despesa TINYINT(1) NOT NULL DEFAULT 0,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_plano_contas_codigo UNIQUE (codigo),
    CONSTRAINT fk_plano_contas_pai FOREIGN KEY (plano_pai_id) REFERENCES plano_contas(id) ON DELETE SET NULL,
    CONSTRAINT fk_plano_contas_classificacao FOREIGN KEY (classificacao_id) REFERENCES plano_contas_classificacoes(id),
    CONSTRAINT fk_plano_contas_grupo FOREIGN KEY (grupo_dre_id) REFERENCES plano_contas_grupos(id),
    CONSTRAINT fk_plano_contas_natureza FOREIGN KEY (natureza_fluxo_id) REFERENCES plano_contas_naturezas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO plano_contas_classificacoes (codigo, nome, slug, descricao, padrao)
VALUES
    ('REC', 'Receita', 'receita', 'Classificação de receitas operacionais', 1),
    ('CUS', 'Custo', 'custo', 'Classificação de custos diretos', 0),
    ('DES', 'Despesa', 'despesa', 'Classificação de despesas operacionais', 0),
    ('IMP', 'Imposto', 'imposto', 'Tributos incidentes sobre o resultado', 0),
    ('OUT', 'Outras', 'outras', 'Classificações diversas e transferências', 0)
ON DUPLICATE KEY UPDATE
    nome = VALUES(nome),
    descricao = VALUES(descricao),
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO plano_contas_naturezas (codigo, nome, slug, descricao, padrao)
VALUES
    ('OPE', 'Operacional', 'operacional', 'Fluxos operacionais do dia a dia', 1),
    ('INV', 'Investimento', 'investimento', 'Entradas e saídas de investimentos', 0),
    ('FIN', 'Financiamento', 'financiamento', 'Operações de financiamento e capital', 0),
    ('TRA', 'Transferência Interna', 'transferencia', 'Transferências entre contas internas', 0)
ON DUPLICATE KEY UPDATE
    nome = VALUES(nome),
    descricao = VALUES(descricao),
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO plano_contas_grupos (codigo, nome, slug, classificacao_id, descricao, padrao)
SELECT codigo, nome, slug, classificacao_id, descricao, padrao FROM (
    SELECT 'REC' AS codigo, 'Receita Operacional' AS nome, 'receita' AS slug,
           (SELECT id FROM plano_contas_classificacoes WHERE slug = 'receita') AS classificacao_id,
           'Receitas provenientes da operação principal' AS descricao,
           1 AS padrao
    UNION ALL
    SELECT 'CV', 'Custo Variável', 'custo_variavel',
           (SELECT id FROM plano_contas_classificacoes WHERE slug = 'custo'),
           'Custos que variam conforme a operação', 0
    UNION ALL
    SELECT 'CF', 'Custo Fixo', 'custo_fixo',
           (SELECT id FROM plano_contas_classificacoes WHERE slug = 'custo'),
           'Custos fixos ligados à operação', 0
    UNION ALL
    SELECT 'DV', 'Despesa Variável', 'despesa_variavel',
           (SELECT id FROM plano_contas_classificacoes WHERE slug = 'despesa'),
           'Despesas variáveis administrativas e comerciais', 0
    UNION ALL
    SELECT 'DF', 'Despesa Fixa', 'despesa_fixa',
           (SELECT id FROM plano_contas_classificacoes WHERE slug = 'despesa'),
           'Despesas fixas administrativas e comerciais', 0
    UNION ALL
    SELECT 'IMP', 'Impostos', 'imposto',
           (SELECT id FROM plano_contas_classificacoes WHERE slug = 'imposto'),
           'Tributos incidentes', 0
    UNION ALL
    SELECT 'TRA', 'Transferência Interna', 'transferencia',
           (SELECT id FROM plano_contas_classificacoes WHERE slug = 'outras'),
           'Movimentações internas entre contas', 0
) AS origem
ON DUPLICATE KEY UPDATE
    nome = VALUES(nome),
    descricao = VALUES(descricao),
    classificacao_id = VALUES(classificacao_id),
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO plano_contas (codigo, nome, descricao, tipo_conta, classificacao_id, grupo_dre_id, natureza_fluxo_id, eh_receita, eh_despesa, ativo)
SELECT '1.01', 'Receita Geral', 'Conta padrão para receitas', 'analitica',
    pc.id, pg.id, pn.id, 1, 0, 1
FROM plano_contas_classificacoes pc
CROSS JOIN plano_contas_grupos pg
CROSS JOIN plano_contas_naturezas pn
WHERE pc.slug = 'receita' AND pg.slug = 'receita' AND pn.slug = 'operacional'
AND NOT EXISTS (SELECT 1 FROM plano_contas WHERE codigo = '1.01')
LIMIT 1;

INSERT INTO plano_contas (codigo, nome, descricao, tipo_conta, classificacao_id, grupo_dre_id, natureza_fluxo_id, eh_receita, eh_despesa, ativo)
SELECT '2.01', 'Despesa Geral', 'Conta padrão para despesas', 'analitica',
    pc.id, pg.id, pn.id, 0, 1, 1
FROM plano_contas_classificacoes pc
CROSS JOIN plano_contas_grupos pg
CROSS JOIN plano_contas_naturezas pn
WHERE pc.slug = 'despesa' AND pg.slug = 'despesa_fixa' AND pn.slug = 'operacional'
AND NOT EXISTS (SELECT 1 FROM plano_contas WHERE codigo = '2.01')
LIMIT 1;

CREATE TABLE IF NOT EXISTS contas_bancarias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(150) NOT NULL,
    banco VARCHAR(120) NOT NULL,
    agencia VARCHAR(20) DEFAULT NULL,
    conta VARCHAR(30) DEFAULT NULL,
    tipo VARCHAR(20) NOT NULL,
    saldo_inicial DECIMAL(14,2) DEFAULT 0,
    observacoes TEXT DEFAULT NULL,
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tabelas_frete (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    descricao VARCHAR(150) NOT NULL,
    origem VARCHAR(120) NOT NULL,
    destino VARCHAR(120) NOT NULL,
    valor_venda DECIMAL(14,2) NOT NULL,
    valor_custo DECIMAL(14,2) NOT NULL,
    observacoes TEXT DEFAULT NULL,
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tabelas_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE TABLE IF NOT EXISTS ctes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20) NOT NULL,
    serie VARCHAR(10) DEFAULT NULL,
    chave VARCHAR(60) DEFAULT NULL,
    cliente_id INT NOT NULL,
    data_emissao DATE DEFAULT NULL,
    valor_frete DECIMAL(14,2) DEFAULT 0,
    origem VARCHAR(120) DEFAULT NULL,
    destino VARCHAR(120) DEFAULT NULL,
    minuta VARCHAR(30) DEFAULT NULL,
    emitente_cnpj VARCHAR(20) DEFAULT NULL,
    peso DECIMAL(14,2) DEFAULT 0,
    cubagem DECIMAL(14,2) DEFAULT 0,
    tipo_operacao VARCHAR(40) DEFAULT NULL,
    vencimento DATE DEFAULT NULL,
    centro_custo_id INT DEFAULT NULL,
    arquivo_xml VARCHAR(255) DEFAULT NULL,
    status VARCHAR(20) DEFAULT 'em_aberto',
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cte_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    CONSTRAINT fk_cte_centro FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id)
);

CREATE TABLE IF NOT EXISTS cte_destinatarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cte_id INT NOT NULL,
    cnpj VARCHAR(20) DEFAULT NULL,
    inscricao_estadual VARCHAR(30) DEFAULT NULL,
    nome VARCHAR(150) DEFAULT NULL,
    telefone VARCHAR(20) DEFAULT NULL,
    logradouro VARCHAR(150) DEFAULT NULL,
    numero VARCHAR(20) DEFAULT NULL,
    complemento VARCHAR(100) DEFAULT NULL,
    bairro VARCHAR(100) DEFAULT NULL,
    codigo_municipio INT DEFAULT NULL,
    municipio VARCHAR(100) DEFAULT NULL,
    cep VARCHAR(10) DEFAULT NULL,
    uf CHAR(2) DEFAULT NULL,
    codigo_pais INT DEFAULT NULL,
    pais VARCHAR(60) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cte_destinatario_cte FOREIGN KEY (cte_id) REFERENCES ctes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cte_remetentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cte_id INT NOT NULL,
    cnpj VARCHAR(20) DEFAULT NULL,
    inscricao_estadual VARCHAR(30) DEFAULT NULL,
    nome VARCHAR(150) DEFAULT NULL,
    nome_fantasia VARCHAR(150) DEFAULT NULL,
    telefone VARCHAR(20) DEFAULT NULL,
    logradouro VARCHAR(150) DEFAULT NULL,
    numero VARCHAR(20) DEFAULT NULL,
    complemento VARCHAR(100) DEFAULT NULL,
    bairro VARCHAR(100) DEFAULT NULL,
    codigo_municipio INT DEFAULT NULL,
    municipio VARCHAR(100) DEFAULT NULL,
    cep VARCHAR(10) DEFAULT NULL,
    uf CHAR(2) DEFAULT NULL,
    codigo_pais INT DEFAULT NULL,
    pais VARCHAR(60) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cte_remetente_cte FOREIGN KEY (cte_id) REFERENCES ctes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS despesas_viagem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cte_id INT NOT NULL,
    categoria_id INT NOT NULL,
    plano_contas_id INT DEFAULT NULL,
    centro_custo_id INT DEFAULT NULL,
    fornecedor_id INT DEFAULT NULL,
    descricao TEXT DEFAULT NULL,
    valor DECIMAL(14,2) NOT NULL,
    data_despesa DATE NOT NULL,
    conta_pagar_id INT DEFAULT NULL,
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_despesa_cte FOREIGN KEY (cte_id) REFERENCES ctes(id),
    CONSTRAINT fk_despesa_categoria FOREIGN KEY (categoria_id) REFERENCES categorias_despesa(id),
    CONSTRAINT fk_despesa_plano FOREIGN KEY (plano_contas_id) REFERENCES plano_contas(id) ON DELETE SET NULL,
    CONSTRAINT fk_despesa_centro FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id),
    CONSTRAINT fk_despesa_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES clientes(id)
);

CREATE TABLE IF NOT EXISTS despesas_fixas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    plano_contas_id INT DEFAULT NULL,
    centro_custo_id INT DEFAULT NULL,
    fornecedor_id INT DEFAULT NULL,
    descricao VARCHAR(150) NOT NULL,
    valor_previsto DECIMAL(14,2) NOT NULL,
    dia_vencimento INT NOT NULL,
    gerar_automaticamente TINYINT(1) DEFAULT 0,
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_despesas_fixas_categoria FOREIGN KEY (categoria_id) REFERENCES categorias_despesa(id),
    CONSTRAINT fk_despesas_fixas_plano FOREIGN KEY (plano_contas_id) REFERENCES plano_contas(id) ON DELETE SET NULL,
    CONSTRAINT fk_despesas_fixas_centro FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id),
    CONSTRAINT fk_despesas_fixas_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES clientes(id)
);

CREATE TABLE IF NOT EXISTS contas_pagar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fornecedor_id INT DEFAULT NULL,
    descricao VARCHAR(180) DEFAULT NULL,
    categoria_id INT NOT NULL,
    plano_contas_id INT DEFAULT NULL,
    centro_custo_id INT DEFAULT NULL,
    valor DECIMAL(14,2) NOT NULL,
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    conta_bancaria_id INT DEFAULT NULL,
    forma_pagamento VARCHAR(30) DEFAULT NULL,
    situacao VARCHAR(20) DEFAULT 'em_aberto',
    tipo_custo VARCHAR(20) DEFAULT 'variavel',
    observacoes TEXT DEFAULT NULL,
    origem VARCHAR(40) DEFAULT NULL,
    cte_id INT DEFAULT NULL,
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cp_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES clientes(id),
    CONSTRAINT fk_cp_categoria FOREIGN KEY (categoria_id) REFERENCES categorias_despesa(id),
    CONSTRAINT fk_cp_plano FOREIGN KEY (plano_contas_id) REFERENCES plano_contas(id) ON DELETE SET NULL,
    CONSTRAINT fk_cp_centro FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id),
    CONSTRAINT fk_cp_conta FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id),
    CONSTRAINT fk_cp_cte FOREIGN KEY (cte_id) REFERENCES ctes(id)
);

CREATE TABLE IF NOT EXISTS contas_pagar_pagamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conta_pagar_id INT NOT NULL,
    data_pagamento DATE NOT NULL,
    valor_pago DECIMAL(14,2) NOT NULL,
    conta_bancaria_id INT DEFAULT NULL,
    observacoes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pagamento_conta FOREIGN KEY (conta_pagar_id) REFERENCES contas_pagar(id),
    CONSTRAINT fk_pagamento_conta_bancaria FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contas_receber (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    categoria_receita_id INT DEFAULT NULL,
    cte_id INT DEFAULT NULL,
    plano_contas_id INT DEFAULT NULL,
    descricao VARCHAR(180) DEFAULT NULL,
    valor DECIMAL(14,2) NOT NULL,
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    conta_bancaria_id INT DEFAULT NULL,
    situacao VARCHAR(20) DEFAULT 'em_aberto',
    observacoes TEXT DEFAULT NULL,
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cr_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    CONSTRAINT fk_cr_categoria_receita FOREIGN KEY (categoria_receita_id) REFERENCES categorias_receita(id) ON DELETE SET NULL,
    CONSTRAINT fk_cr_cte FOREIGN KEY (cte_id) REFERENCES ctes(id),
    CONSTRAINT fk_cr_plano FOREIGN KEY (plano_contas_id) REFERENCES plano_contas(id) ON DELETE SET NULL,
    CONSTRAINT fk_cr_conta FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id)
);

CREATE TABLE IF NOT EXISTS contas_receber_recebimentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conta_receber_id INT NOT NULL,
    data_recebimento DATE NOT NULL,
    valor_recebido DECIMAL(14,2) NOT NULL,
    desconto DECIMAL(14,2) DEFAULT 0,
    forma_pagamento VARCHAR(30) DEFAULT NULL,
    conta_bancaria_id INT DEFAULT NULL,
    observacoes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recebimentos_conta FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id),
    CONSTRAINT fk_recebimentos_banco FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conciliacoes_bancarias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conta_bancaria_id INT NOT NULL,
    arquivo_banco_id INT DEFAULT NULL,
    fitid VARCHAR(128) DEFAULT NULL,
    data_movimentacao DATE NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    tipo ENUM('entrada','saida') NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    memo VARCHAR(255) DEFAULT NULL,
    status ENUM('pendente','autorizado','ignorado') NOT NULL DEFAULT 'pendente',
    lancamento_tipo ENUM('conta_receber','conta_pagar','outro') DEFAULT NULL,
    lancamento_id INT DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT DEFAULT NULL,
    authorized_at DATETIME DEFAULT NULL,
    authorized_by INT DEFAULT NULL,
    ignored_at DATETIME DEFAULT NULL,
    ignored_by INT DEFAULT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_conciliacao_fitid (conta_bancaria_id, fitid),
    INDEX idx_conciliacao_status (status),
    INDEX idx_conciliacao_conta_status (conta_bancaria_id, status),
    CONSTRAINT fk_conciliacao_conta FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimentacoes_financeiras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conta_bancaria_id INT NOT NULL,
    conciliacao_id INT DEFAULT NULL,
    lancamento_tipo ENUM('conta_receber','conta_pagar','outro') DEFAULT 'outro',
    lancamento_id INT DEFAULT NULL,
    tipo_movimentacao ENUM('entrada','saida') NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor_original DECIMAL(15,2) NOT NULL,
    valor_liquido DECIMAL(15,2) NOT NULL,
    data_movimentacao DATE NOT NULL,
    data_liquidacao DATE DEFAULT NULL,
    observacoes TEXT DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT DEFAULT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_movimentacao_conta_data (conta_bancaria_id, data_movimentacao),
    INDEX idx_movimentacao_lancamento (lancamento_tipo, lancamento_id),
    CONSTRAINT fk_movimentacao_conta FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id),
    CONSTRAINT fk_movimentacao_conciliacao FOREIGN KEY (conciliacao_id) REFERENCES conciliacoes_bancarias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contas_receber_ctes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conta_receber_id INT NOT NULL,
    cte_id INT NOT NULL,
    valor DECIMAL(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cr_ctes_conta FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id),
    CONSTRAINT fk_cr_ctes_cte FOREIGN KEY (cte_id) REFERENCES ctes(id),
    CONSTRAINT uq_cr_ctes UNIQUE (conta_receber_id, cte_id),
    CONSTRAINT uq_cr_cte UNIQUE (cte_id)
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil ENUM('administrador','financeiro','diretoria','operacao') NOT NULL,
    status ENUM('ativo','inativo') DEFAULT 'ativo',
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO categorias_despesa (plano_contas_id, nome, tipo, ativo)
SELECT (SELECT id FROM plano_contas WHERE eh_despesa = 1 LIMIT 1), 'Combustível', 'variavel', 1
WHERE NOT EXISTS (SELECT 1 FROM categorias_despesa LIMIT 1);

INSERT INTO categorias_receita (plano_contas_id, nome, ativo)
SELECT (SELECT id FROM plano_contas WHERE eh_receita = 1 LIMIT 1), 'Frete', 1
WHERE NOT EXISTS (SELECT 1 FROM categorias_receita LIMIT 1);

INSERT INTO usuarios (nome, email, senha_hash, perfil, status)
SELECT nome, email, senha_hash, perfil, status FROM (
    SELECT
        'Administrador' AS nome,
        'admin@transportadora.com' AS email,
        '$2y$10$RHiXVtHPRLDH0J61AmZg0Op5utYz2YlZyU8LJYIxlviOL8XlepTWS' AS senha_hash,
        'administrador' AS perfil,
        'ativo' AS status
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM usuarios LIMIT 1);

-- RBAC: perfis (roles) e permissões – necessário para o menu (DRE, Fluxo de caixa, etc.)
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

SET FOREIGN_KEY_CHECKS=1;
