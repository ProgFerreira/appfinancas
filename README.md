# Financeiro Transportadora (Next.js)

Sistema financeiro para transportadoras, front-end em **Next.js 16**, **TypeScript** e **Tailwind CSS**, usando o banco de dados **transportadora_financeiro** (MySQL).

Inclui: **competência vs caixa**, **ledger** imutável, **DRE por competência**, **fluxo de caixa por caixa**, **importação OFX**, **conciliação** (sugestões e confirmação), **RBAC** e **auditoria**.

## Requisitos

- **Node.js** 18+
- **MySQL** 8+ com o banco `transportadora_financeiro` criado e com as tabelas do schema

## Configuração

1. **Instalar dependências**

   ```bash
   npm install
   ```

2. **Variáveis de ambiente**

   Copie o exemplo e ajuste:

   ```bash
   cp .env.example .env.local
   ```

   Edite `.env.local`:

   - `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` – conexão MySQL
   - `APP_SECRET` – chave secreta para sessão (troque em produção)

3. **Banco de dados**

   - A aplicação agora sincroniza automaticamente schema e migrations no startup do back-end.
   - Garanta que o banco informado em `DB_DATABASE` já exista e que o usuário tenha permissão de `CREATE/ALTER`.
   - Se quiser executar manualmente, rode `database/schema.sql` e as migrations `database/migrations/*.sql` em ordem numérica (`001_...`, `002_...`, ..., `019_...`).
   - Variáveis opcionais da sincronização automática:
     - `DB_SCHEMA_SYNC=false` desativa sincronização no startup.
     - `DB_SCHEMA_SYNC_LOCK_NAME` define nome do lock de migração.
     - `DB_SCHEMA_SYNC_LOCK_TIMEOUT_SEC` timeout do lock (padrão 30s).
     - `DB_SCHEMA_ALLOW_CHANGED_MIGRATIONS=true` permite reaplicar migration já aplicada com checksum alterado.

   Usuário padrão (após seed do schema):

   - E-mail: `admin@transportadora.com`
   - Senha: conforme definido no seed (ex.: ver `database/schema.sql`)

## Como rodar

### Desenvolvimento (Windows com Node + MySQL)

- **MySQL**: pode ser o **WAMP** (MySQL na porta 3306) ou MySQL instalado separadamente. O Next.js roda via Node, não pelo WAMP.
- No terminal (PowerShell ou CMD), na pasta do projeto:

  ```bash
  npm run dev
  ```

  Acesse: [http://localhost:3000](http://localhost:3000). A raiz redireciona para `/login` ou `/dashboard`.

### Testes

  ```bash
  npm test
  ```

  (Usa o test runner do Node em `tests/`.)

### Build e produção

  ```bash
  npm run build
  npm start
  ```

## Deploy

- Build: `npm run build`
- Variáveis de ambiente em produção: `DB_*`, `APP_SECRET`, `NODE_ENV=production`
- Servir com `npm start` ou processo manager (PM2, systemd, etc.)
- MySQL acessível pela rede ou local conforme sua infraestrutura

## Estrutura do projeto

```
src/
├── app/
│   ├── (auth)/login/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── contas-pagar/   contas-receber/
│   │   ├── fluxo-caixa/    DRE por caixa (data real pagamento/recebimento)
│   │   ├── dre/            DRE por competência
│   │   ├── bank/importar   bank/transacoes   (OFX)
│   │   ├── conciliacao/    Sugestões e confirmar/rejeitar
│   │   └── ...
│   └── api/
├── lib/                    db, auth, rbac
├── modules/
│   ├── finance/            domain, services, repositories, validators (AP/AR, Ledger, DRE, CashFlow)
│   └── bank/               ofx (parser), reconciliation
├── components/
└── types/
```

## Funcionalidades

- **Login / Logout** (cookie assinado, httpOnly).
- **Dashboard** com resumos e alertas.
- **Contas a pagar / Contas a receber**: CRUD, baixa com **competência** e **ledger** (razão imutável), **auditoria**.
- **Fluxo de caixa**: por data real de pagamento/recebimento, filtros por conta/categoria.
- **DRE**: por **competência** (data_competencia dos títulos), receitas, custos, despesas, resultado.
- **Importar OFX**: upload de extrato, tabelas `bank_statement_imports` e `bank_transactions`, dedup por (conta, fit_id).
- **Conciliação**: transações do extrato sem match; gerar sugestões (valor ± tolerância, data ± dias); confirmar/rejeitar (RBAC: `reconciliation.confirm`).
- **RBAC**: tabelas `roles`, `permissions`, `role_permissions`, `user_roles`; `hasPermission(userId, code)`; perfil `administrador` tem todas as permissões.

## Banco de dados

- **Banco:** `transportadora_financeiro`
- **Verificar conexão:** GET `/api/db/health`
- **Sincronização automática:** ocorre na primeira conexão ao banco no startup (schema base + migrations).

## Checklist de boas práticas

- [x] Competência (DRE) separada de caixa (fluxo)
- [x] Ledger imutável; correções por estorno
- [x] Validação Zod nas entradas
- [x] CSRF não implementado (considerar em formulários críticos)
- [x] Headers de segurança (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- [x] Auditoria em criação de baixas (audit_logs)
- [ ] Rate limit no login (recomendado em produção)
- [ ] Próximos passos: rateio, recorrência, orçamento, vínculo manual conciliação (criar pagamento/recebimento a partir do extrato)
