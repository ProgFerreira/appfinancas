# Conexão com o banco MySQL (WAMP)

Quando as telas **Clientes**, **Contas a pagar** ou **Contas a receber** mostram **"Erro ao carregar dados"** ou **"Verifique a conexão com o banco"**, siga estes passos.

**Se você for redirecionado para a tela de login:** o sistema não encontrou sessão (cookie). Faça login novamente.

## 1. Ver o erro exato

- **Na tela:** em desenvolvimento, a mensagem de erro nas telas de Clientes, Contas a pagar e Contas a receber já exibe o detalhe do MySQL (ex.: "Table 'transportadora_financeiro.clientes' doesn't exist"). Use o link **"Verificar conexão com o banco (/api/db/health)"** que aparece no quadro de erro.
- **Diretamente:** abra no navegador (logado ou não):

**http://localhost:3000/api/db/health**

A resposta em JSON mostrará:
- `success: true` → conexão OK
- `success: false` e campo `detail` → mensagem de erro do MySQL (ex.: banco não existe, acesso negado, conexão recusada, tabela não existe)

## 2. Conferir o WAMP

- **MySQL está rodando?** No WAMP, o ícone deve ficar verde. Se estiver laranja/vermelho, clique e inicie o MySQL.
- **Porta:** o padrão é 3306. No `.env.local` use `DB_PORT=3306`.

## 3. Arquivo `.env.local`

Na raiz do projeto (`c:\wamp64\www\financas\.env.local`):

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=transportadora_financeiro
DB_USERNAME=root
DB_PASSWORD=
```

- Se o usuário **root** do MySQL tiver senha, preencha: `DB_PASSWORD=sua_senha`
- Se o MySQL estiver em outro PC/serviço, altere `DB_HOST` (e porta, se for o caso).

## 4. Criar as tabelas (se o erro for "Table ... doesn't exist")

Se o **/api/db/health** indicar que a conexão está OK mas ao entrar no dashboard aparecer erro tipo **"Table 'transportadora_financeiro.contas_pagar' doesn't exist"**, é porque o banco existe mas as tabelas ainda não foram criadas.

1. Abra o **phpMyAdmin** (menu do WAMP) ou conecte no MySQL.
2. Selecione o banco **transportadora_financeiro** (ou crie-o antes).
3. Vá na aba **Importar** (Import) e escolha o arquivo:
   ```
   c:\wamp64\www\financas\database\schema.sql
   ```
4. Clique em **Executar**. O script cria todas as tabelas e insere um usuário admin:
   - **E-mail:** admin@transportadora.com  
   - **Senha:** (a mesma definida no projeto financial3; se não souber, altere depois pelo MySQL ou crie um novo usuário).

Se preferir, você pode colar e executar o conteúdo do arquivo **database/schema.sql** na aba SQL do phpMyAdmin.

Depois disso, recarregue o dashboard do sistema.

## 5. Reiniciar o Next.js

Depois de alterar o `.env.local`:

- Pare o servidor (Ctrl+C) e rode de novo: `npm run dev`.
