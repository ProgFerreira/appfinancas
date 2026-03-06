# Comparativo: Telas x Banco de Dados

Comparação entre os campos das tabelas e o que está nas telas (formulários e listagens).  
**Legenda:** ✅ implementado | ❌ falta implementar | — não se aplica / só leitura.

---

## 1. Clientes

| Campo no banco | Formulário | Listagem | API GET/POST/PUT |
|----------------|------------|----------|------------------|
| id | — | — | ✅ |
| nome | ✅ | ✅ | ✅ |
| razao_social | ✅ | ✅ | ✅ |
| cnpj_cpf | ✅ | ✅ | ✅ |
| inscricao_estadual | ✅ | — | ✅ |
| tipo_cadastro | ✅ | ✅ | ✅ |
| classificacao | ✅ | ✅ | ✅ |
| contato | ✅ | — | ✅ |
| email | ✅ | ✅ | ✅ |
| telefone | ✅ | — | ✅ |
| observacoes | ✅ | — | ✅ |
| cep | ✅ | — | ✅ |
| logradouro | ✅ | — | ✅ |
| numero | ✅ | — | ✅ |
| bairro | ✅ | — | ✅ |
| municipio | ✅ | ✅ (Cidade/UF) | ✅ |
| uf | ✅ | ✅ (Cidade/UF) | ✅ |
| prazo_pagamento | ✅ | — | ✅ |
| tipo_cobranca | ✅ | — | ✅ |
| centro_custo_id | ✅ | — | ✅ |
| categoria_receita_id | ✅ | — | ✅ |
| categoria_despesa_id | ✅ | — | ✅ |
| ativo | ✅ | ✅ | ✅ |
| complemento | ✅ | — | ✅ |
| tipo_parceiro | ✅ | — | ✅ |
| condicao_pagamento | ✅ | — | ✅ |
| dados_bancarios | ✅ | — | ✅ |
| pode_faturar | ✅ | — | ✅ |
| telefone_xml | ✅ | — | ✅ |
| codigo_municipio | ✅ | — | ✅ |
| codigo_pais | ✅ | — | ✅ |
| pais | ✅ | — | ✅ |
| plano_contas_id | ✅ | — | ✅ |
| plano_contas_despesa_id | ✅ | — | ✅ |
| created_at, updated_at | — | — | GET retorna |

---

## 2. Contas a pagar

| Campo no banco | Formulário | Listagem | API |
|----------------|------------|----------|-----|
| id | — | — | ✅ |
| fornecedor_id | ✅ | ✅ (nome) | ✅ |
| descricao | ✅ | ✅ | ✅ |
| categoria_id | ✅ | ✅ (nome) | ✅ |
| plano_contas_id | ✅ | ✅ (nome) | ✅ |
| centro_custo_id | ✅ | ✅ (nome) | ✅ |
| valor | ✅ | ✅ | ✅ |
| data_emissao | ✅ | ✅ | ✅ |
| data_vencimento | ✅ | ✅ | ✅ |
| conta_bancaria_id | ✅ | ✅ (descrição) | ✅ |
| forma_pagamento | ✅ | ✅ | ✅ |
| situacao | — | ✅ | ✅ |
| tipo_custo | ✅ | ✅ | ✅ |
| plano_contas (nome) | — | ✅ | ✅ (JOIN) |
| observacoes | ✅ | — | ✅ |
| origem | ✅ | — | ✅ |
| cte_id | ✅ | — | ✅ |
| ativo, created_at, updated_at | — | — | GET |

---

## 3. Contas a receber

| Campo no banco | Formulário | Listagem | API |
|----------------|------------|----------|-----|
| id | — | — | ✅ |
| cliente_id | ✅ | ✅ (nome) | ✅ |
| categoria_receita_id | ✅ | ✅ (nome) | ✅ |
| plano_contas_id | ✅ | ✅ (nome) | ✅ |
| descricao | ✅ | ✅ | ✅ |
| valor | ✅ | ✅ | ✅ |
| data_emissao | ✅ | ✅ (listagem) | ✅ |
| data_vencimento | ✅ | ✅ | ✅ |
| conta_bancaria_id | ✅ | ✅ (descrição) | ✅ |
| situacao | — | ✅ | ✅ |
| observacoes | ✅ | — | ✅ |
| cte_id | ✅ | — | ✅ |
| ativo, created_at, updated_at | — | — | GET |

---

## 4. Dashboard

- Usa: **contas_pagar** (valor, data_emissao, data_vencimento, situacao, tipo_custo), **contas_receber** (valor, data_emissao, data_vencimento, situacao), **clientes** (count), **despesas_fixas** (valor_previsto, ativo).
- Todos os campos necessários estão cobertos. A coluna **valor_previsto** em `despesas_fixas` deve existir (migration em `database/migrations/20250227_add_valor_previsto_despesas_fixas.sql`).

---

## 5. Despesas fixas

| Campo no banco | Formulário | Listagem | API |
|----------------|------------|----------|-----|
| id | — | — | ✅ |
| categoria_id | ✅ | ✅ (nome) | ✅ |
| plano_contas_id | ✅ | ✅ (nome) | ✅ |
| centro_custo_id | ✅ | ✅ (nome) | ✅ |
| fornecedor_id | ✅ | ✅ (nome) | ✅ |
| descricao | ✅ | ✅ | ✅ |
| valor_previsto | ✅ | ✅ | ✅ |
| dia_vencimento | ✅ | ✅ | ✅ |
| gerar_automaticamente | ✅ | — | ✅ |
| ativo | ✅ | ✅ | ✅ |
| created_at, updated_at | — | — | GET |

---

## 6. CTe

| Campo no banco | Formulário | Listagem | API |
|----------------|------------|----------|-----|
| id | — | — | ✅ |
| numero | ✅ | ✅ | ✅ |
| serie | ✅ | ✅ | ✅ |
| chave | ✅ | — | ✅ |
| cliente_id | ✅ | ✅ (nome) | ✅ |
| data_emissao | ✅ | ✅ | ✅ |
| valor_frete | ✅ | ✅ | ✅ |
| origem | ✅ | ✅ | ✅ |
| destino | ✅ | ✅ | ✅ |
| minuta | ✅ | — | ✅ |
| emitente_cnpj | ✅ | — | ✅ |
| peso | ✅ | — | ✅ |
| cubagem | ✅ | — | ✅ |
| tipo_operacao | ✅ | — | ✅ |
| vencimento | ✅ | — | ✅ |
| centro_custo_id | ✅ | ✅ (nome) | ✅ |
| arquivo_xml | ✅ | — | ✅ |
| status | — | ✅ | ✅ |
| ativo | ✅ | ✅ | ✅ |
| created_at, updated_at | — | — | GET |

### CTe – Destinatários (aba na edição)

| Campo no banco | Formulário | Listagem | API |
|----------------|------------|----------|-----|
| id | — | — | ✅ |
| cte_id | — | — | ✅ |
| cnpj, inscricao_estadual | ✅ | — | ✅ |
| nome, telefone | ✅ | — | ✅ |
| logradouro, numero, complemento, bairro | ✅ | — | ✅ |
| codigo_municipio, municipio, cep, uf | ✅ | — | ✅ |
| codigo_pais, pais | ✅ | — | ✅ |

### CTe – Remetentes (aba na edição)

| Campo no banco | Formulário | Listagem | API |
|----------------|------------|----------|-----|
| id | — | — | ✅ |
| cte_id | — | — | ✅ |
| cnpj, inscricao_estadual | ✅ | — | ✅ |
| nome, nome_fantasia, telefone | ✅ | — | ✅ |
| logradouro, numero, complemento, bairro | ✅ | — | ✅ |
| codigo_municipio, municipio, cep, uf | ✅ | — | ✅ |
| codigo_pais, pais | ✅ | — | ✅ |

---

## 7. Contas bancárias

| Campo no banco | Formulário | Listagem | API |
|----------------|------------|----------|-----|
| id | — | — | ✅ |
| descricao | ✅ | ✅ | ✅ |
| banco | ✅ | ✅ | ✅ |
| agencia | ✅ | ✅ | ✅ |
| conta | ✅ | ✅ | ✅ |
| tipo | ✅ | ✅ | ✅ |
| saldo_inicial | ✅ | — | ✅ |
| observacoes | ✅ | — | ✅ |
| ativo | ✅ | ✅ | ✅ |
| created_at, updated_at | — | — | GET |

---

## 8. Categorias de despesa

| Campo no banco | Formulário | Listagem | API |
|----------------|------------|----------|-----|
| id | — | — | ✅ |
| plano_contas_id | ✅ | ✅ (nome) | ✅ |
| nome | ✅ | ✅ | ✅ |
| tipo | ✅ | ✅ | ✅ |
| descricao | ✅ | — | ✅ |
| ativo | ✅ | ✅ | ✅ |
| created_at, updated_at | — | — | GET |

---

## 9. Categorias de receita

| Campo no banco | Formulário | Listagem | API |
|----------------|------------|----------|-----|
| id | — | — | ✅ |
| plano_contas_id | ✅ | ✅ (nome) | ✅ |
| nome | ✅ | ✅ | ✅ |
| descricao | ✅ | — | ✅ |
| ativo | ✅ | ✅ | ✅ |
| created_at, updated_at | — | — | GET |

---

## 10. Centros de custo

| Campo no banco | Formulário | Listagem | API |
|----------------|------------|----------|-----|
| id | — | — | ✅ |
| codigo | ✅ | ✅ | ✅ |
| nome | ✅ | ✅ | ✅ |
| natureza_id | ✅ | ✅ (nome) | ✅ |
| natureza | ✅ | ✅ | ✅ |
| plano_contas | ✅ | — | ✅ |
| descricao | ✅ | — | ✅ |
| ordem | ✅ | — | ✅ |
| ativo | ✅ | ✅ | ✅ |
| created_at, updated_at | — | — | GET |

---

## 11. Naturezas

| Campo no banco | Formulário | Listagem | API |
|----------------|------------|----------|-----|
| id | — | — | ✅ |
| codigo | ✅ | ✅ | ✅ |
| nome | ✅ | ✅ | ✅ |
| natureza_pai_id | ✅ | ✅ (hierarquia) | ✅ |
| tipo | ✅ | ✅ | ✅ |
| descricao | ✅ | — | ✅ |
| nivel | — | — | GET |
| ordem | ✅ | — | ✅ |
| ativo | ✅ | ✅ | ✅ |
| created_at, updated_at | — | — | GET |

---

## 12. Motoristas

| Campo no banco | Formulário | Listagem | API |
|----------------|------------|----------|-----|
| id | — | — | ✅ |
| parceiro_id | ✅ | ✅ (nome) | ✅ |
| nome | ✅ | ✅ | ✅ |
| cpf | ✅ | ✅ | ✅ |
| telefone | ✅ | — | ✅ |
| email | ✅ | — | ✅ |
| tipo_vinculo | ✅ | ✅ | ✅ |
| observacoes | ✅ | — | ✅ |
| ativo | ✅ | ✅ | ✅ |
| created_at, updated_at | — | — | GET |

---

## 13. Veículos

| Campo no banco | Formulário | Listagem | API |
|----------------|------------|----------|-----|
| id | — | — | ✅ |
| placa | ✅ | ✅ | ✅ |
| modelo | ✅ | ✅ | ✅ |
| tipo | ✅ | ✅ | ✅ |
| ano | ✅ | — | ✅ |
| proprietario_tipo | ✅ | — | ✅ |
| proprietario_id | ✅ | — | ✅ |
| renavam | ✅ | — | ✅ |
| capacidade | ✅ | — | ✅ |
| observacoes | ✅ | — | ✅ |
| ativo | ✅ | ✅ | ✅ |
| created_at, updated_at | — | — | GET |

---

## 14. Tabelas de frete

| Campo no banco | Formulário | Listagem | API |
|----------------|------------|----------|-----|
| id | — | — | ✅ |
| cliente_id | ✅ | ✅ (nome) | ✅ |
| descricao | ✅ | ✅ | ✅ |
| origem | ✅ | ✅ | ✅ |
| destino | ✅ | ✅ | ✅ |
| valor_venda | ✅ | ✅ | ✅ |
| valor_custo | ✅ | ✅ | ✅ |
| observacoes | ✅ | — | ✅ |
| ativo | ✅ | ✅ | ✅ |
| created_at, updated_at | — | — | GET |

---

## 15. Despesas de viagem

| Campo no banco | Formulário | Listagem | API |
|----------------|------------|----------|-----|
| id | — | — | ✅ |
| cte_id | ✅ | ✅ (ref CTe) | ✅ |
| categoria_id | ✅ | ✅ (nome) | ✅ |
| plano_contas_id | ✅ | ✅ (nome) | ✅ |
| centro_custo_id | ✅ | ✅ (nome) | ✅ |
| fornecedor_id | ✅ | ✅ (nome) | ✅ |
| descricao | ✅ | ✅ | ✅ |
| valor | ✅ | ✅ | ✅ |
| data_despesa | ✅ | ✅ | ✅ |
| conta_pagar_id | ✅ | — | ✅ |
| ativo | ✅ | ✅ | ✅ |
| created_at, updated_at | — | — | GET |

---

## 16. Plano de contas

| Campo no banco | Formulário | Listagem | API |
|----------------|------------|----------|-----|
| id | — | — | ✅ |
| codigo | ✅ | ✅ | ✅ |
| nome | ✅ | ✅ | ✅ |
| descricao | ✅ | — | ✅ |
| plano_pai_id | ✅ (Novo) | ✅ (árvore) | ✅ |
| tipo_conta | ✅ | ✅ | ✅ |
| classificacao_id | ✅ | — | ✅ |
| grupo_dre_id | ✅ | — | ✅ |
| natureza_fluxo_id | ✅ | — | ✅ |
| eh_receita | ✅ | ✅ | ✅ |
| eh_despesa | ✅ | ✅ | ✅ |
| ativo | ✅ | ✅ | ✅ |
| created_at, updated_at | — | — | GET |

---

## 17. Conciliação bancária

| Campo no banco | Formulário | Listagem | API |
|----------------|------------|----------|-----|
| id | — | — | ✅ |
| conta_bancaria_id | ✅ | ✅ (descrição) | ✅ |
| arquivo_banco_id | ✅ | — | ✅ |
| fitid | — | — | GET |
| data_movimentacao | ✅ | ✅ | ✅ |
| valor | ✅ | ✅ | ✅ |
| tipo | ✅ | ✅ | ✅ |
| descricao | ✅ | ✅ | ✅ |
| memo | ✅ | — | ✅ |
| status | ✅ | ✅ | ✅ |
| lancamento_tipo | ✅ | — | ✅ |
| lancamento_id | ✅ | — | ✅ |
| created_at, authorized_at, ignored_at, updated_at | — | — | GET |

---

## 18. Usuários

| Campo no banco | Formulário | Listagem | API |
|----------------|------------|----------|-----|
| id | — | — | ✅ |
| nome | ✅ | ✅ | ✅ |
| email | ✅ | ✅ | ✅ |
| senha_hash | ✅ (novo/editar) | — | POST/PUT |
| perfil | ✅ | ✅ | ✅ |
| status | ✅ | ✅ | ✅ |
| ativo | ✅ | ✅ | ✅ |
| created_at, updated_at | — | — | GET |

---

## 19. Contas a receber × CTe (vínculos)

| Campo no banco | Formulário | Listagem | API |
|----------------|------------|----------|-----|
| id | — | — | ✅ |
| conta_receber_id | ✅ | ✅ (ref) | ✅ |
| cte_id | ✅ | ✅ (ref) | ✅ |
| valor | ✅ | ✅ | ✅ |
| created_at | — | — | GET |

---

_(Itens da seção “O que ainda falta” foram implementados; ver Resumo abaixo.)_




---

## Resumo do que já foi implementado

1. **Clientes:** todos os campos do banco; listagem com Classificação e Cidade/UF. **Abas no editar:** Dados gerais, Contatos, Dados bancários, Categorias.
2. **Cliente – subcadastros (abas Editar cliente):** **cliente_contatos** (CRUD), **cliente_dados_bancarios** (CRUD), **cliente_categorias** (adicionar/remover).
3. **Contas a pagar:** origem, cte_id; listagem com data_emissão, tipo_custo e plano. Baixa grava em `contas_pagar_pagamentos`.
4. **Contas a receber:** cte_id; listagem com data_emissão. Baixa grava em `contas_receber_recebimentos`.
5. **Despesas fixas:** CRUD completo; menu no sidebar.
6. **CTe:** CRUD completo (listagem, novo, editar); menu "CTe" no sidebar; API `/api/ctes` e `/api/ctes/[id]`.
7. **Dashboard:** leitura de resumos; usa despesas_fixas.valor_previsto (migration em `database/migrations/`).

### Tabelas sem tela CRUD própria (uso indireto)

- **cte_destinatarios**, **cte_remetentes:** podem ser abas na edição do CTe se necessário.
- **contas_pagar_pagamentos** / **contas_receber_recebimentos:** preenchidos pelas telas de baixa.

---

## O que ainda falta (avaliação)

### Prioridade média – implementado

| Item | Tabela(s) | Situação |
|------|-----------|----------|
| **Cadastro de contas bancárias** | `contas_bancarias` | ✅ Módulo completo: listagem, novo, editar (descrição, banco, agência, conta, tipo, saldo_inicial, observações, ativo). |
| **Cadastro de categorias** | `categorias_despesa`, `categorias_receita` | ✅ Categorias de despesa e Categorias de receita (listagem + CRUD, com plano de contas). |
| **Cadastro de centros de custo** | `centros_custo` | ✅ Módulo Centros de custo (listagem, novo, editar; natureza_id e natureza tipo). |
| **Subcadastros do CTe** | `cte_destinatarios`, `cte_remetentes` | ✅ Abas Destinatários e Remetentes na tela Editar CTe (CRUD por aba). |

### Prioridade baixa – implementado

| Item | Tabela(s) | Situação |
|------|-----------|----------|
| **Tabelas de frete** | `tabelas_frete` | ✅ Módulo completo: listagem, novo, editar, visualizar, excluir (soft). Campos: cliente_id, descrição, origem, destino, valor_venda, valor_custo, observacoes, ativo. |
| **Despesas de viagem** | `despesas_viagem` | ✅ Módulo completo: listagem, novo, editar, visualizar, excluir (soft). Vinculada a cte_id, categorias, plano_contas, centro_custo, etc. |
| **Motoristas / Veículos** | `motoristas`, `veiculos` | ✅ CRUD completo para ambos: listagem, novo, editar, visualizar, excluir (soft). Menu no sidebar. |
| **Plano de contas** | `plano_contas` | ✅ Listagem (com filtro ativo), novo, editar, visualizar, excluir (soft). Estrutura hierárquica no banco; tela em árvore é opcional. |
| **Naturezas** | `naturezas` | ✅ CRUD completo: listagem, novo, editar, visualizar, excluir (soft). Usada como “raiz” de centros de custo. |

### Apenas uso indireto – implementado onde aplicável

| Item | Situação |
|------|----------|
| **Histórico de baixas** | ✅ Páginas Visualizar em contas-pagar e contas-receber exibem a tabela de pagamentos/recebimentos. |
| **Conciliação bancária** | ✅ CRUD conciliacoes_bancarias; listagem movimentacoes_financeiras em /movimentacoes. Menu no sidebar. Padrão Visualizar \| Editar \| Excluir aplicado. |
| **Contas a receber × CTe** | ✅ Tela dedicada em /contas-receber-ctes: listagem de vínculos (contas_receber_ctes), formulário para vincular, ação Desvincular. Menu no sidebar. |
| **Usuários** | ✅ CRUD usuarios: listagem, novo, editar, visualizar, excluir (soft); senha com bcryptjs. Menu no sidebar. |

### O que ainda falta (análise atualizada)

Com base no documento e no código em `src/`:

#### 1. Padrão Visualizar | Editar | Excluir (Soft Delete)

O padrão **já está aplicado** em: Clientes, Contas a pagar, Contas a receber, Despesas fixas, CTe, Categorias despesa, Categorias receita, Contas bancárias, Centros de custo, Naturezas, Motoristas, Veículos, Usuários, **Tabelas de frete**, **Despesas de viagem**, **Plano de contas**, **Conciliação bancária**.

| Módulo | Situação |
|--------|----------|
| **Naturezas** | ✅ Implementado: CrudActionsCell, Visualizar, Excluir (soft), API DELETE, página `[id]/visualizar`. |
| **Tabelas de frete** | ✅ Implementado: CrudActionsCell, Visualizar, Excluir (soft), API DELETE, página `[id]/visualizar`. |
| **Motoristas** | ✅ Implementado: CrudActionsCell, Visualizar, Excluir (soft), API DELETE, página `[id]/visualizar`. |
| **Veículos** | ✅ Implementado: CrudActionsCell, Visualizar, Excluir (soft), API DELETE, página `[id]/visualizar`. |
| **Despesas de viagem** | ✅ Implementado: CrudActionsCell, Visualizar, Excluir (soft), API DELETE, página `[id]/visualizar`. |
| **Plano de contas** | ✅ Implementado: CrudActionsCell, Visualizar, Excluir (soft), API DELETE, página `[id]/visualizar`. |
| **Usuários** | ✅ Implementado: CrudActionsCell, Visualizar, Excluir (soft), API DELETE, página `[id]/visualizar`. |
| **Conciliação bancária** | ✅ Implementado: CrudActionsCell (apiBasePath="/conciliacoes"), Visualizar, Excluir (status=ignorado), API DELETE, página `[id]/visualizar`. |

#### 2. Ajustes opcionais

- **Contas a pagar/receber – listagem:** ✅ Implementado: listagem de contas a pagar exibe Categoria, Plano, Centro custo, Conta bancária e Forma de pagamento; listagem de contas a receber exibe Categoria receita, Plano de contas e Conta bancária (APIs com JOINs; colunas adicionadas nas tabelas).
- **Plano de contas – visão em árvore:** ✅ Implementado: aba "Árvore" na página Plano de contas, com hierarquia por `plano_pai_id` e indentação.
- **Contas a receber × CTe:** ✅ Implementado: tela dedicada em **Contas a receber × CTe** (menu no sidebar): listagem de vínculos da tabela `contas_receber_ctes`, formulário para vincular (conta a receber + CTe + valor), ação Desvincular (DELETE). API `/api/contas-receber-ctes` (GET, POST) e `/api/contas-receber-ctes/[id]` (DELETE).

#### 3. Observação sobre a tabela "Prioridade baixa"

A tabela "Prioridade baixa" acima diz "Sem tela" para vários itens, mas no código **já existem** módulos e menus para: Naturezas, Tabelas de frete, Motoristas, Veículos, Despesas de viagem, Plano de contas, Usuários, Conciliação. O padrão **Visualizar | Editar | Excluir** já foi estendido para todas essas listagens.

### Resumo executivo

- **Já implementado:** Clientes (com abas Contatos, Dados bancários, Categorias), Contas a pagar, Contas a receber, Despesas fixas, CTe (com abas na edição), Dashboard; baixa em contas_pagar_pagamentos e contas_receber_recebimentos; Contas bancárias, Categorias de despesa/receita, Centros de custo; Naturezas, Tabelas de frete, Motoristas, Veículos, Despesas de viagem, **Plano de contas (listagem, novo, editar, visualizar, árvore, excluir soft)**; Histórico de baixas (visualizar título em contas-pagar e contas-receber); Conciliação bancária (CRUD conciliações + listagem movimentações); Usuários (CRUD com senha hasheada); **Contas a receber × CTe** (tela de vínculos). **Padrão Visualizar | Editar | Excluir (soft delete)** aplicado em todos os módulos listados.
- **Falta (prioridade):** Nenhum item pendente para o padrão Visualizar | Editar | Excluir.
- **Opcional:** Todos implementados: listagem contas a pagar/receber com mais campos (categoria, plano, centro custo, conta, forma pag.); tela em árvore do plano de contas; tela Contas a receber × CTe (vínculos).

---

## Revisão (o que faltava e foi corrigido)

- **Plano de contas – Nova conta:** Faltava API POST `/api/plano-contas`, página `/plano-contas/novo` e botão "Nova conta" na tela. Implementado: POST com validação (código, nome), uso de classificacao_id/grupo_dre_id/natureza_fluxo_id padrão do banco; página Novo com formulário (código, nome, conta pai, descrição, tipo, receita/despesa, ativo); botão na página do plano de contas.
- **Plano de contas – Opcionais:** Implementado: formulários Novo e Editar com seleção de **Classificação**, **Grupo DRE** (filtrado por classificação) e **Natureza** (API `/api/plano-contas/options`; GET/PUT/POST com os três IDs).
- **Documento:** Tabelas das seções 2 e 3 atualizadas para refletir que a listagem de contas a pagar e contas a receber exibe categoria, plano, centro custo, conta e forma de pagamento (quando aplicável). Seção "Apenas uso indireto" atualizada com ✅ para Conciliação bancária e Contas a receber × CTe e texto alinhado à tela dedicada de vínculos. **Tabelas comparativas campo a campo** (seções 5–19) adicionadas para: Despesas fixas, CTe (e abas Destinatários/Remetentes), Contas bancárias, Categorias despesa/receita, Centros de custo, Naturezas, Motoristas, Veículos, Tabelas de frete, Despesas de viagem, Plano de contas, Conciliação bancária, Usuários, Contas a receber × CTe.

---

## Resumo – O que falta

| Prioridade | Situação | Detalhe |
|------------|----------|---------|
| **Alta** | Nada | Todos os módulos e fluxos previstos no comparativo estão implementados. |
| **Média** | Nada | Padrão Visualizar \| Editar \| Excluir, listagens com campos adicionais, plano em árvore e tela Contas a receber × CTe já estão feitos. |
| **Baixa / opcional** | Concluído | (1) **Plano de contas:** ✅ Formulários Novo e Editar permitem escolher classificacao_id, grupo_dre_id e natureza_fluxo_id. (2) **Documentação:** ✅ Tabelas comparativas campo a campo (seções 5–19) para Despesas fixas, CTe, Contas bancárias, Categorias, Centros de custo, Naturezas, Motoristas, Veículos, Tabelas de frete, Despesas de viagem, Plano de contas, Conciliação, Usuários e Contas a receber × CTe. (3) **Outros:** testes, CI/CD e deploy fora do escopo. |

**Conclusão:** Para o escopo deste documento (telas x banco), **não há pendências obrigatórias**. O que eventualmente "falta" resume-se a refinamentos opcionais e à documentação comparativa dos outros módulos.