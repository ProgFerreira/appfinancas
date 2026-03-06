# Módulo Cotação de Frete — Escopo e Checklist

> Menu separado: **Cotações**  
> ERP de transportadora • Next.js (App Router) + TypeScript + Tailwind + MySQL (mysql2/promise, sem ORM)

---

## Objetivo do Módulo

- [ ] **1** Cadastro/gestão de **Parceiros** (transportadoras e cias aéreas)
- [ ] **2** Cadastro/gestão de **Tabelas de Preço** por parceiro (rodoviário e aéreo)
- [ ] **3** Tela de **Cotação**: origem/destino + peso + dimensões + valor NF + serviços (AR, mão própria etc.)
- [ ] **4** **Resultado da cotação**: listar todas as opções de todos os parceiros do trecho, com preço final e prazo, ordenação (mais barato / mais rápido) e botão "Selecionar" para salvar a opção (que depois vira operação/OT)

---

## A) Parceiros (CRUD)

- [ ] Campos: nome, tipo (RODOVIARIO | AEREO | AMBOS), CNPJ, contato, email, telefone, ativo, observações
- [ ] Regra: parceiro pode atender várias "praças" (cidades/UF/CEP range)
- [ ] API: GET/POST `/api/partners`
- [ ] API: GET/PUT/DELETE (soft) `/api/partners/[id]`
- [ ] Páginas: `/cadastros/parceiros`, `/cadastros/parceiros/novo`, `/cadastros/parceiros/[id]/editar`, `/cadastros/parceiros/[id]/tabelas`

---

## B) Cobertura (Praças atendidas)

- [ ] Cadastro de cobertura por parceiro: UF/cidade (ex.: São Paulo/SP, Rio de Janeiro/RJ)
- [ ] Opcional: faixa de CEP (cep_inicio / cep_fim)
- [ ] Na cotação: retornar só parceiros que atendem o **DESTINO** (e opcionalmente ORIGEM)
- [ ] API: GET/POST/DELETE `/api/partners/[id]/coverages`
- [ ] Componente: **CoverageEditor**

---

## C) Tabelas de Preço por parceiro

### C.1 Tabela por trecho e faixa de peso (MVP)

- [ ] origem_praça → destino_praça
- [ ] peso_inicial, peso_final
- [ ] valor_base (ou valor_minimo)
- [ ] valor_excedente_por_kg (opcional)
- [ ] prazo_dias

### C.2 Taxas: padrão do parceiro e por trecho

- **Modelo unificado:** Parceiro × Trecho × Taxas. Um trecho (tabela de preço) pode ter taxas próprias; se não tiver, a cotação usa as taxas padrão do parceiro.
- Tabela `cotacao_partner_fees`: taxas padrão do parceiro (GRIS, Ad Valorem, TDE, TRT, TDA, pedágio, seguro, coleta/entrega, cubagem, peso mínimo).
- Tabela `cotacao_price_table_fees`: taxas por trecho (mesmos campos + `prazo_rodoviario_dias`, `prazo_aereo_dias`). Na cotação: usa taxas do trecho se existirem; senão usa taxas do parceiro.
- [ ] GRIS, Ad Valorem, TDE/TRT/TDA, Pedágio, Seguro, Coleta/Entrega, Fator cubagem, Peso mínimo, Prazos (rod./aér.)

### C.3 APIs e telas

- [ ] API: GET/POST `/api/price-tables`, GET/PUT/DELETE (soft) `/api/price-tables/[id]`
- [ ] API: GET/POST/PUT/DELETE `/api/price-tables/[id]/ranges`
- [x] API: GET/POST `/api/price-tables/[id]/fees` (taxas do trecho)
- [ ] API: GET/POST/PUT `/api/partner-fees` (taxas padrão do parceiro)
- [x] Tela unificada: em **Parceiros** → aba **Tabelas e faixas**, ao clicar em **Editar trecho e taxas** abre um único bloco com: **Trecho** (nome, origem, destino), **Faixas de peso** e **Taxas do trecho** (GRIS, Ad Valorem, pedágio, seguro, coleta/entrega, prazos etc.)
- [ ] Componentes: **TrechoUnifiedContent** (trecho + faixas + taxas), **RangesInline**, **CoverageEditor**

---

## D) Tela de Cotação (UI)

- [x] Rota: `/comercial/cotacao` (form + resultados)
- [x] Form tipo "Central do Frete" com:
  - [x] Origem e Destino por **cidade** (UF + cidade, dropdowns carregados de `cep_pracas` via `/api/pracas`)
  - [x] Tipo de carga (dropdown)
  - [ ] Valor da nota fiscal
  - [ ] Volumes (lista dinâmica): qtd, altura, largura, comprimento, peso por volume
  - [ ] Serviços: AR, Mão Própria, Coleta, Entrega, Seguro
- [ ] Cálculos em tempo real no client (apenas exibição):
  - [ ] Peso real total
  - [ ] Peso cubado total (soma cubagem por volume)
  - [ ] Peso tarifável = max(peso real, peso cubado)
- [ ] Botão "Cotação instantânea" chama API e exibe resultados
- [ ] Componentes: **QuoteForm**, **VolumeRepeater**

---

## E) Resultado da Cotação (UI)

- [ ] Lista de opções estilo marketplace: (transportadora, modalidade, postagem/coleta, prazo, preço, botão Selecionar)
- [ ] Ordenar: Mais barato (default) / Mais rápido / Melhor custo-benefício
- [ ] Detalhamento expandível (breakdown): base, excedente, gris, advalorem, pedágio, taxas, seguro, coleta/entrega
- [ ] Ao clicar "Selecionar": salvar em `quote_selections` (quote_id, partner_id, preço final, prazo, breakdown_json, status='selecionada')
- [ ] API: POST `/api/quotes/[id]/select`
- [ ] Componente: **QuoteResultsList**

---

## Requisitos Técnicos (sem ORM)

### 1) MySQL DDL

- [ ] Arquivos em `/database/migrations`: `011_cotacao_*.sql` (tabelas), seed em `012_cotacao_*`
- [ ] Tabelas com created_at, updated_at, deleted_at (soft delete onde aplicável)
- [ ] Índices: partner_id, origem/destino, route

### 2) Camada de banco

- [ ] `src/lib/db.ts`: pool mysql2/promise (já existe)
- [ ] `src/lib/tx.ts`: helper de transação
- [ ] `src/repositories/*.repo.ts` ou em API: queries parametrizadas (NUNCA concatenação de SQL)

### 3) API Routes (Next App Router)

- [ ] POST `/api/quotes/calc`: recebe payload da cotação, persiste quote + items, calcula e retorna lista de opções
- [ ] CRUD parceiros, coverages, price-tables, ranges, partner-fees (conforme seções A, B, C)
- [ ] POST `/api/quotes/[id]/select`: salva escolha

### 4) Regras de Cálculo (server-side)

- [ ] Origem CEP → praça/cidade/UF (tabela cep_pracas ou lookup; MVP: UF/cidade simples)
- [ ] Destino CEP → praça/cidade/UF
- [ ] Para cada parceiro elegível: encontrar faixa (peso_inicial ≤ peso ≤ peso_final)
- [ ] Calcular: valor_base, excedente, GRIS, AdValorem, Seguro, TDE/TRT/TDA, Coleta/Entrega
- [ ] preço_final = soma; prazo_total = prazo_faixa + ajustes
- [ ] Retornar: partner, modal, prazo, preco_final, breakdown
- [ ] Documentar regra de excedente (peso vs faixa) e implementar consistente

### 5) Validações e DTOs

- [ ] Zod no client e server
- [ ] Máscaras CEP/moeda
- [ ] Impedir cotação sem volumes
- [ ] Impedir ranges sobrepostos na mesma tabela (validação no backend)

### 6) UI e rotas (resumo)

- [ ] `/comercial/cotacao`
- [ ] `/cadastros/parceiros` (list), `/cadastros/parceiros/novo`, `/cadastros/parceiros/[id]/editar`, `/cadastros/parceiros/[id]/tabelas`
- [ ] `/cadastros/tabelas-preco` (list), `/cadastros/tabelas-preco/[id]` (faixas)
- [ ] `/cadastros/taxas-parceiro`

---

## Componentes

- [ ] **QuoteForm**
- [ ] **VolumeRepeater**
- [ ] **QuoteResultsList**
- [ ] **PartnerForm**
- [ ] **CoverageEditor**
- [ ] **PriceTableEditor**
- [ ] **RangeGridEditor**
- [ ] **FeesEditor**

---

## Seed / Exemplo

- [ ] Parceiro A (rodoviário) atende SP → RJ
- [ ] Parceiro B (aéreo) atende SP → RJ
- [ ] Tabelas com faixas: 0–5 kg, 5–10 kg, 10–30 kg
- [ ] Taxas: GRIS 0.8%, Ad Valorem 0.4%, pedágio fixo 12, seguro mínimo 10 e 0.2%
- [ ] Teste: cotar SP (01000-000) → RJ (20000-000), 0,5 kg, dimensões 10×15×15, valor NF 100 → retornar 2 opções

---

## Padrões

- [ ] Regra de cálculo apenas no server (não em componentes React)
- [ ] Arquitetura: `src/services` (regras e cálculos), repositórios nas APIs ou `src/repositories`, `src/app` (páginas)
- [ ] Tratamento de erros consistente (HTTP status)
- [ ] Soft delete em cadastros
- [ ] Queries parametrizadas sempre

---

## Entregáveis

- [ ] SQL DDL + seed
- [ ] db pool + tx helper + queries nas APIs/repos
- [ ] Services de cálculo
- [ ] APIs
- [ ] Telas completas
- [ ] README ou doc com setup, como cadastrar tabelas e como testar a cotação

---

## Menu do sistema

- [x] Menu principal **Cotações** unificado:
  - [x] Cotação de frete (`/comercial/cotacao`)
  - [x] **Parceiros** (`/cadastros/parceiros`) — uma única tela com: dados do parceiro, cobertura (praças), tabelas de preço, faixas de peso e taxas (abas)
  - [ ] (Opcional) Histórico de cotações / seleções

---

## Setup e como testar

### 1. Rodar as migrations

No MySQL (banco `transportadora_financeiro`), execute na ordem:

```bash
# Tabelas do módulo
mysql -u root -p transportadora_financeiro < database/migrations/011_cotacao_init.sql

# Permissões + seed (parceiros, cobertura, tabelas, faixas, taxas, CEP)
mysql -u root -p transportadora_financeiro < database/migrations/012_cotacao_seed.sql
```

### 2. Permissões

As permissões `cotacao.view`, `parceiros.view`, `tabelas-preco-cotacao.view` e `taxas-parceiro.view` são inseridas pelo seed. O seed associa elas ao **role_id = 1** (perfil administrador). Se seu usuário admin usar outro perfil, atribua essas permissões ao perfil desejado em **Configurações > Perfis**.

### 3. Cadastrar tabelas e testar a cotação

- **Parceiros (tudo em uma tela):** Menu **Cotações > Parceiros**. Selecione um parceiro no dropdown (ou "Novo parceiro"). Abas: **Dados** (cadastro), **Cobertura** (praças), **Tabelas e faixas** (tabelas + faixas de peso), **Taxas** (GRIS, Ad Valorem, pedágio, seguro, etc.). O seed já cria dois parceiros com cobertura SP/RJ, tabelas SP→RJ e faixas 0–5, 5–10, 10–30 kg.
- **Praças (origem/destino):** A tela de cotação usa **UF + cidade** (não CEP). As opções vêm da tabela `cep_pracas` (distinct UF/cidade). O seed insere SP (São Paulo) e RJ (Rio de Janeiro). Para mais cidades, insira registros em `cep_pracas` (cada faixa de CEP gera uma praça; o dropdown usa as praças distintas).

### 4. Teste de cotação

1. Acesse **Cotações > Cotação de frete**.
2. **Origem:** selecione UF **SP** e cidade **São Paulo**. **Destino:** UF **RJ** e cidade **Rio de Janeiro**.
3. Adicione um volume: ex. 1 un, 10×15×15 cm, 0,5 kg.
4. Valor da NF: 100. Marque serviços se quiser (ex.: Seguro).
5. Clique em **Cotação instantânea**. Devem aparecer 2 opções (Parceiro A rodoviário e Parceiro B aéreo), com preço e prazo.
6. Clique em **Selecionar** na opção desejada para salvar a escolha (registro em `cotacao_quote_selections`).
