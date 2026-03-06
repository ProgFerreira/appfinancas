# Análise de filtros por tela

Todas as telas de listagem e relatórios devem ter **filtros básicos** consistentes. Abaixo: estado atual e filtros recomendados.

---

## Resumo por tela

| Tela | Filtros atuais | Filtros recomendados | Observação |
|------|----------------|----------------------|------------|
| **Contas a pagar** | Situação (em_aberto, parcial, pago) | + **Período vencimento** (de/até), **Conta bancária**, **Categoria**, **Busca** (fornecedor/descrição) | API só tem situacao; falta período, conta, categoria, q |
| **Contas a receber** | Situação (em_aberto, parcial, recebido) | + **Período vencimento** (de/até), **Conta bancária**, **Categoria**, **Busca** (cliente/descrição) | Idem |
| **Clientes** | Busca (q), Ativo (1/0) | **Ativo** (Ativos / Inativos / Todos) | OK; garantir opção "Todos" se não houver |
| **Despesas fixas** | Ativo (1/0) | + **Categoria**, **Centro de custo** (opcional) | API só ativo |
| **CTe** | Ativo (1/0/all) | + **Período emissão** (de/até), **Cliente**, **Busca** (número/série) | API só ativo |
| **Movimentações** | Conta bancária | **Conta bancária** | OK |
| **Fluxo de caixa** | Data início, Data fim | + **Conta bancária**, **Centro de custo**, **Categoria** | API já suporta; falta na UI |
| **DRE** | Data início, Data fim | + **Centro de custo**, **Grupo** (receita/custo/despesa/imposto) | API já suporta; falta na UI |
| **Extrato bancário** | Conta, Data início, Data fim | — | OK |
| **Transações extrato (bank/transacoes)** | Conta, De/Até, Situação, Importação | — | OK |
| **Contas bancárias** | Ativo (1/0) | **Ativo** (Ativos / Inativos / Todos) | OK |
| **Categorias despesa** | Ativo (1/0) | + **Busca** (nome), **Tipo** (se houver) | API só ativo |
| **Categorias receita** | Ativo (1/0) | + **Busca** (nome) | API só ativo |
| **Centros de custo** | Ativo (1/0) | + **Busca** (nome/código), **Natureza** | API só ativo |
| **Plano de contas** | Ativo (1/0) | + **Busca** (código/nome), **Tipo** | API só ativo |
| **Motoristas** | Ativo (1/0/all) | + **Busca** (nome/CPF), **Tipo vínculo** | API só ativo |
| **Veículos** | Ativo (1/0/all) | + **Busca** (placa/modelo), **Tipo** | API só ativo |
| **Naturezas** | Ativo (1/0) | + **Busca** (nome) | API só ativo |
| **Tabelas de frete** | Ativo (1/0) | + **Busca** (nome) | API só ativo |
| **Despesas de viagem** | Ativo (1/0), CTe (opcional) | **Ativo**, **CTe** (já existe na API) | Verificar se UI expõe cte_id |
| **Usuários** | Status (ativo/inativo/all) | + **Busca** (nome/email), **Perfil** | API só status |
| **Conciliação bancária (conciliacoes)** | Status | + **Conta bancária**, **Período** | API tem status; verificar conta/período |
| **Dashboard** | Data início, Data fim (API) | Exibir período e opcionalmente **Conta** | Depende do layout |

---

## Padrão sugerido de filtros básicos

1. **Listagens de cadastros (clientes, categorias, centros, plano de contas, motoristas, veículos, etc.)**
   - **Ativo**: Ativos | Inativos | Todos
   - **Busca (q)**: texto livre (nome, código, etc.) quando fizer sentido
   - Paginação: page, per_page

2. **Listagens financeiras (contas a pagar/receber)**
   - **Situação**: em aberto | parcial | pago/recebido
   - **Período de vencimento**: data de, data até
   - **Conta bancária**: opcional
   - **Categoria**: opcional
   - **Busca**: opcional (fornecedor/cliente ou descrição)
   - Paginação

3. **Relatórios (fluxo de caixa, DRE)**
   - **Período**: data início, data fim (obrigatório)
   - **Conta bancária**: opcional (fluxo de caixa)
   - **Centro de custo**: opcional
   - **Categoria** (ou **Grupo** no DRE): opcional

4. **Bancário (movimentações, extrato, transações)**
   - **Conta bancária**: obrigatório no extrato; opcional em movimentações/transações
   - **Período**: de/até onde fizer sentido
   - **Situação**: onde existir (ex.: transações extrato)

---

## Prioridade de implementação

- **Alta**: Contas a pagar e Contas a receber — período vencimento, conta bancária, categoria, busca.
- **Alta**: Fluxo de caixa e DRE — expor na UI os filtros que a API já aceita (conta, centro de custo, categoria/grupo).
- **Média**: CTe — período emissão, cliente, busca.
- **Média**: Cadastros (categorias, centros, plano de contas, motoristas, veículos) — busca por texto.
- **Média**: Usuários — busca, perfil.
- **Baixa**: Despesas fixas — categoria; Conciliação — conta e período.

Este documento serve como referência para implementar e padronizar filtros em todas as telas.
