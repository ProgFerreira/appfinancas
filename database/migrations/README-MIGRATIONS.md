# Migrations

Execute as migrations na ordem do número no nome do arquivo (ex.: `001_*`, `002_*`).

## Execução automática no startup

O back-end executa automaticamente `database/schema.sql` e depois as migrations numeradas (`001...`) ao iniciar a primeira conexão com MySQL.

- Migrações aplicadas ficam registradas na tabela `schema_migrations` com checksum.
- Se uma migration já aplicada tiver checksum alterado, a execução falha por segurança.
- Para permitir reaplicar migration alterada (não recomendado), use `DB_SCHEMA_ALLOW_CHANGED_MIGRATIONS=true`.

## RBAC e menu (DRE, Fluxo de caixa)

Para que **DRE** e **Fluxo de caixa** apareçam no menu lateral (Relatórios), o banco precisa das tabelas `roles`, `permissions`, `role_permissions` e `user_roles` e das permissões inseridas.

- Se você usa o `schema.sql` completo, ele já inclui essas tabelas e as permissões (`dre.view`, `fluxo-caixa.view`, etc.).
- Se o banco foi criado antes disso, execute: `001_rbac_roles_permissions.sql`

## reconciliation_matches e FKs

A tabela `reconciliation_matches` tem **apenas** a chave estrangeira para `bank_transactions`.  
**Não** há FKs para `contas_pagar_pagamentos` e `contas_receber_recebimentos` para evitar o erro:

```text
#1824 - Failed to open the referenced table 'contas_pagar_pagamentos'
```

Esse erro costuma ocorrer quando:

- A tabela não existe no banco (o schema base não foi aplicado).
- A tabela está em **MyISAM** (o MySQL não permite FK de InnoDB para MyISAM).

**O que fazer:**

1. **Não** execute ALTER para adicionar FKs a `contas_pagar_pagamentos` / `contas_receber_recebimentos`. A aplicação funciona sem essas FKs; os índices em `payable_payment_id` e `receivable_receipt_id` já existem para consultas.
2. Se for **nova instalação**, use o `schema.sql` atualizado (com `ENGINE=InnoDB` nessas duas tabelas). Assim, se no futuro quiser adicionar as FKs, as tabelas já estarão em InnoDB.
3. Se o banco já existia e as tabelas estão em MyISAM e você **quiser** FKs:
   - Converta para InnoDB:  
     `ALTER TABLE contas_pagar_pagamentos ENGINE=InnoDB;`  
     `ALTER TABLE contas_receber_recebimentos ENGINE=InnoDB;`
   - Depois adicione as FKs em `reconciliation_matches` (opcional).

## Novas migrations estruturais (018 e 019)

- `018_financeiro_competencia_ledger_audit.sql`
  - adiciona `data_competencia` em `contas_pagar` e `contas_receber`.
  - cria `ledger_entries` e `audit_logs`.
- `019_bank_ofx_reconciliation.sql`
  - cria/atualiza `bank_statement_imports`, `bank_transactions` e `reconciliation_matches`.
