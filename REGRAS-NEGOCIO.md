# Regras de negócio – validação com o projeto PHP (financial3)

Este documento descreve as regras de negócio das telas **Dashboard**, **Clientes**, **Contas a pagar** e **Contas a receber**, com base no projeto PHP de referência, e o que está implementado no Next.js.

---

## 1. Dashboard

### No PHP (financial3)

- **Visão geral (período):**
  - **Faturamento:** soma de `contas_receber.valor` onde `data_emissao` entre data_inicio e data_fim e `ativo = 1`.
  - **Custos variáveis:** soma de `contas_pagar.valor` onde `tipo_custo = 'variavel'`, `data_emissao` no período e `ativo = 1`.
  - **Custos fixos:** soma de `despesas_fixas.valor_previsto` (ativos) × número de meses no período.
  - **Resultado:** faturamento − custos variáveis − custos fixos.
  - **Percentuais:** % custos fixos e % custos variáveis sobre o faturamento.
- **Filtros:** data_inicio e data_fim (padrão: primeiro e último dia do mês).
- **Alertas:** contas a pagar/receber vencidas (`situacao = 'em_aberto'` e `data_vencimento < CURDATE()`).
- **Fluxo de caixa:** entradas/saídas por `data_vencimento`, apenas `situacao IN ('em_aberto', 'parcial')`.
- **Margem por CT-e / Ranking clientes:** dependem de tabelas `ctes`, `despesas_viagem` e estruturas mais complexas.

### No Next.js (financas)

- **Implementado (alinhado ao PHP):**
  - Contas a pagar em aberto: quantidade e soma (`situacao IN ('em_aberto', 'parcial')`, `ativo = 1`).
  - Contas a receber em aberto: quantidade e soma (mesmo critério).
  - Total de clientes ativos.
  - **Filtro por período:** `data_inicio` e `data_fim` (query params); padrão: primeiro dia do mês e hoje.
  - **Visão geral do período:** faturamento (soma `contas_receber` por `data_emissao`), custos variáveis (soma `contas_pagar` com `tipo_custo = 'variavel'` por `data_emissao`), custos fixos (soma `despesas_fixas.valor_previsto` × meses no período), resultado e percentuais sobre faturamento.
  - **Alertas:** contas a pagar e contas a receber vencidas (`situacao = 'em_aberto'` e `data_vencimento < hoje`).
  - **Fluxo de caixa previsto:** entradas e saídas por `data_vencimento` no período (`situacao IN ('em_aberto', 'parcial')`).
- **Implementado (Margem por CT-e e Ranking de clientes):**
  - **Margem por CT-e:** tabela no Dashboard com CT-es do período (data_emissao); para cada CT-e: receita = valor_frete, custo = soma das despesas de viagem (despesas_viagem) do CT-e, margem = receita − custo. Exibição com link para o CT-e. Limite 50 registros.
  - **Ranking de clientes:** tabela com top 15 clientes por faturamento no período (soma de contas_receber.valor onde data_emissao no período). Link para o cliente.

**Conclusão:** Dashboard Next alinhado ao PHP para período, visão geral, alertas, fluxo, margem por CT-e e ranking de clientes.

---

## 2. Clientes

### No PHP (financial3)

- **Campos principais:** nome, razao_social, cnpj_cpf, tipo_cadastro, email, telefone, observacoes, ativo.
- **Obrigatório:** nome.
- **tipo_cadastro:** deve ser um de: `cliente`, `fornecedor`, `funcionario`, `parceiro`, `empresa`, `outros` (constante `Cliente::CATEGORIAS_DISPONIVEIS`).
- **CNPJ/CPF:** não pode haver outro cliente **ativo** com o mesmo documento (normalizado, só dígitos). Na edição, desconsiderar o próprio registro.
- **ativo:** 0 ou 1; inativo não entra em listagens padrão (a não ser filtro “Todos”).

### No Next.js (financas)

- **Implementado:**
  - Nome obrigatório.
  - tipo_cadastro restrito aos mesmos seis valores.
  - ativo padrão 1; filtros Ativos / Inativos / Todos na listagem.
- **Implementado nesta validação:**
  - Validação de CNPJ/CPF duplicado: ao criar ou editar, se `cnpj_cpf` for informado (e tiver 11+ dígitos após normalizar), não pode existir outro cliente ativo com o mesmo documento (na edição, excluindo o próprio id). A API retorna **409** com mensagem "Já existe um cliente ativo com este CNPJ/CPF." quando houver duplicidade.

**Conclusão:** Regras de clientes alinhadas ao PHP, incluindo unicidade de CNPJ/CPF para ativos.

---

## 3. Contas a pagar

### No PHP (financial3)

- **Situações:** `em_aberto`, `pago`, `parcial`.
- **Campos:** fornecedor_id (opcional), descricao, categoria_id (obrigatório na tabela), plano_contas_id, centro_custo_id, valor, data_emissao, data_vencimento, conta_bancaria_id, forma_pagamento, tipo_custo (fixo/variavel), observacoes.
- **Obrigatórios:** categoria (categoria_despesa_id ou categoria_id), valor > 0, data_emissao, data_vencimento.
- **Baixa (pagamento):** valor_pago ≥ valor do título → `situacao = 'pago'`; caso contrário → `parcial`.
- **Formas de pagamento aceitas:** boleto, deposito, debito, credito, dinheiro, pix (opcional no cadastro).
- **tipo_custo:** usado no dashboard PHP para custos variáveis; padrão na tabela: `variavel`.

### No Next.js (financas)

- **Implementado:**
  - Listagem com filtro por situação (em_aberto, parcial, pago).
  - Criação com: fornecedor (opcional), categoria (obrigatória), descricao, valor, data_emissao, data_vencimento, centro_custo, conta_bancaria, forma_pagamento, observacoes.
  - Validação: valor > 0, datas e categoria obrigatórios.
- **Tabela:** usa `categoria_id` (schema transportadora_financeiro). Coluna `tipo_custo` existe com default; não é obrigatória no formulário.

- **Baixa (registro de pagamento):** tela `/contas-pagar/[id]/baixa` e API `POST /api/contas-pagar/[id]/baixa` (data_pagamento, valor_pago, conta_bancaria_id, observacoes). Inserção em `contas_pagar_pagamentos`; situação atualizada para `pago` se valor_pago ≥ valor do título, senão `parcial`.

**Conclusão:** Regras de cadastro, situação e baixa alinhadas ao PHP.

---

## 4. Contas a receber

### No PHP (financial3)

- **Situações:** `em_aberto`, `recebido`, `parcial`.
- **Campos:** cliente_id (obrigatório), categoria_receita_id, descricao, valor, data_emissao, data_vencimento, conta_bancaria_id, observacoes.
- **Obrigatórios:** cliente_id, valor > 0, data_emissao, data_vencimento.
- **Baixa (recebimento):** (valor_recebido + desconto) ≥ valor do título → `situacao = 'recebido'`; caso contrário → `parcial`.

### No Next.js (financas)

- **Implementado:**
  - Listagem com filtro por situação (em_aberto, parcial, recebido).
  - Criação com: cliente (obrigatório), categoria_receita (opcional), descricao, valor, data_emissao, data_vencimento, conta_bancaria, observacoes.
  - Validação: cliente, valor > 0 e datas obrigatórios.

- **Baixa (registro de recebimento):** tela `/contas-receber/[id]/baixa` e API `POST /api/contas-receber/[id]/baixa` (data_recebimento, valor_recebido, desconto, conta_bancaria_id, observacoes). Inserção em `contas_receber_recebimentos`; situação atualizada para `recebido` se (valor_recebido + desconto) ≥ valor do título, senão `parcial`.

**Conclusão:** Regras de cadastro, situação e baixa alinhadas ao PHP.

---

## 5. Resumo de validações aplicadas no Next.js

| Tela / API      | Regra (PHP)              | Status no Next.js                          |
|-----------------|--------------------------|--------------------------------------------|
| Dashboard       | Contas em aberto (total/soma) | OK                                    |
| Dashboard       | Período, faturamento, custos, resultado | OK (implementado)                 |
| Dashboard       | Alertas vencidas, fluxo de caixa        | OK (implementado)                 |
| Dashboard       | Margem por CT-e, ranking de clientes    | OK (implementado)                  |
| Contas a pagar  | tipo_custo (fixo/variavel)              | OK (form + API)                   |
| Contas a pagar  | Baixa (registrar pagamento)              | OK (API + tela)                   |
| Contas a receber| Baixa (registrar recebimento)           | OK (API + tela)                   |
| Clientes        | Nome obrigatório         | OK                                        |
| Clientes        | tipo_cadastro enum 6 valores | OK                                    |
| Clientes        | CNPJ/CPF único (ativos) | Implementado (validação na API)           |
| Contas a pagar  | Categoria obrigatória    | OK                                        |
| Contas a pagar  | Valor > 0, datas         | OK                                        |
| Contas a receber| Cliente obrigatório      | OK                                        |
| Contas a receber| Valor > 0, datas         | OK                                        |

Referência: projeto PHP em `financial3` (Dashboard, ClienteController, ContaPagarController, ContaReceberController, modelos Cliente, TituloPagar, TituloReceber, Dashboard).
