# Deploy na Hostinger

## Business Web Hosting (com Node.js) — login funcionando

O plano **Business Web Hosting** da Hostinger inclui suporte a **Node.js** (até 5 aplicações). Use esse modo para ter **login e APIs** funcionando.

### Passo a passo

1. **No painel Hostinger**  
   Acesse **Websites** → seu domínio → **Node.js** (ou **Aplicações Node** / **Web Apps**). Crie uma nova aplicação Node.js.

2. **Configuração da app**
   - **Node.js version:** 18.x ou 20.x
   - **Application root:** pasta onde ficará o projeto (ex: `public_html` ou a pasta que o painel indicar)
   - **Application startup file:** não usar para Next.js; o comando de start é `npm start` (veja abaixo)

3. **Envio do projeto**
   - Envie o **projeto inteiro** por **Git** (recomendado) ou **ZIP/FTP**.
   - **Não** envie: `node_modules/`, `.next/`, `.env`, `.env.local`.
   - No servidor (SSH ou terminal do painel):  
     `npm install --production` (ou `npm install`)  
     `npm run build`  
     O start costuma ser: `npm start` ou `npx next start -H 0.0.0.0 -p PORT` (a Hostinger pode informar a porta).

4. **Variáveis de ambiente** (no painel da aplicação Node.js)
   - `DB_HOST=localhost`
   - `DB_PORT=3306`
   - `DB_DATABASE=u256572549_financas`
   - `DB_USERNAME=u256572549_financas`
   - `DB_PASSWORD=0B~Q1c4Atm@26@`
   - `APP_SECRET=` (gere uma chave longa e aleatória)
   - `APP_URL=https://seudominio.com`

5. **Build para Node (não estático)**  
   Para rodar com Node e ter login, use um build **sem** export estático. No servidor (ou antes de enviar), rode:
   ```bash
   set NEXT_OUTPUT_MODE=node
   npm run build
   npm start
   ```
   (No Linux/Mac: `NEXT_OUTPUT_MODE=node npm run build`.)  
   Ou configure no painel Hostinger a variável de ambiente `NEXT_OUTPUT_MODE=node` e o comando de build como `npm run build`. Assim o Next sobe com `npm start` e as rotas `/api/*` e o login passam a funcionar.

Depois do deploy, acesse a URL do site e teste o login.

---

## Banco: desenvolvimento local → MySQL Hostinger

O projeto está configurado para usar o banco **u256572549_financas** na Hostinger. As credenciais estão em `.env.local`.

Para desenvolver **localmente** e conectar no MySQL da Hostinger:

1. No painel Hostinger: **Databases** → **Remote MySQL** → adicione o **IP da sua internet** (ou `%` para qualquer IP, menos seguro).
2. Copie o **hostname** do MySQL (ex: `localhost` ou algo como `srv123.hostinger.com`).
3. No seu `.env.local`, defina:
   - `DB_HOST=` **hostname que a Hostinger mostrar** (se for app na própria Hostinger use `localhost`; se for seu PC, use o host remoto do painel).
   - `DB_DATABASE=u256572549_financas`
   - `DB_USERNAME=u256572549_financas`
   - `DB_PASSWORD=0B~Q1c4Atm@26@`

Assim o app rodando no seu PC usa o banco na Hostinger.

---

## O que enviar para a Hostinger (site estático)

Com `output: 'export'` no Next.js, o build gera arquivos estáticos. Para publicar:

### 1. Gerar o build

```bash
npm run build
```

### 2. Enviar apenas a pasta **`out/`**

Envie **todo o conteúdo** da pasta **`out/`** para a raiz do seu domínio (ou da pasta pública) na Hostinger.

Estrutura após o build:

```
out/
├── _next/          # JS, CSS e assets
├── api/            # Rotas de API (arquivos estáticos pré-gerados)
├── bank/
├── dashboard/
├── login
├── index.html
├── ...
```

**O que mandar:** tudo que está **dentro** de `out/` (incluindo `_next`, `api`, pastas de rotas, `index.html`, etc.).

**Como enviar:**  
- FTP/SFTP: conecte no domínio e suba o conteúdo de `out/` para a pasta pública (ex: `public_html`).  
- Ou use o Gerenciador de Arquivos do painel Hostinger e faça upload da pasta.

### 3. Não enviar

- `node_modules/`
- `.env` / `.env.local` (credenciais não vão no servidor de arquivos estáticos)
- Pasta `out/` em si: envie **o conteúdo** de `out/`, não a pasta vazia

### 4. Por que dá "Erro de conexão" ao logar?

Se você subiu **só o conteúdo da pasta `out/`** (arquivos estáticos), **não há servidor rodando**. As rotas `/api/auth/login`, `/api/dashboard`, etc. não executam — viram arquivos estáticos gerados no build. Por isso o login falha com "Erro de conexão".

**Para o login funcionar na Hostinger você precisa:**

- **Rodar o app com Node.js** na Hostinger (plano que suporte Node.js ou VPS), **não** só enviar a pasta `out/`.

**Como fazer (com Node na Hostinger):**

1. No painel, use a opção de **Node.js** ou **Aplicação Node** (se o seu plano tiver).
2. Envie o **projeto inteiro** (menos `node_modules` e `.next`) ou use Git.
3. No servidor: `npm install`, `npm run build`, e inicie com `npm start` (ou o comando que a Hostinger indicar).
4. Configure as **variáveis de ambiente** no painel da Hostinger:
   - `DB_HOST=localhost` (quando o app roda na mesma Hostinger que o MySQL)
   - `DB_DATABASE=u256572549_financas`
   - `DB_USERNAME=u256572549_financas`
   - `DB_PASSWORD=0B~Q1c4Atm@26@`
   - `APP_SECRET=` uma chave secreta longa e aleatória
   - `APP_URL=` a URL do seu site (ex: https://seusite.com)

Se o seu plano for **apenas hospedagem de arquivos estáticos** (sem Node.js), o login e qualquer API **não vão funcionar** com esse projeto. Aí seria preciso um backend em outro lugar (outro servidor, serverless, etc.).

---

## Resumo rápido

| Objetivo                         | O que fazer |
|----------------------------------|-------------|
| **Login funcionando (Business)** | Deploy com **Node.js** na Hostinger: remover `output: 'export'` do `next.config.ts`, enviar projeto, `npm install` + `npm run build` + `npm start`, configurar variáveis de ambiente (DB_*, APP_SECRET, APP_URL). |
| Desenvolver local → banco Hostinger | Ajustar `DB_HOST` no `.env.local` com o host do painel e liberar seu IP em Remote MySQL. |
| Publicar site estático (sem login) | Manter `output: 'export'`, `npm run build` e enviar **todo o conteúdo da pasta `out/`** para a pasta pública do domínio. |
