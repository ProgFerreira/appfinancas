# MCPs configurados neste projeto

## next-devtools
- **Uso:** Next.js – runtime da aplicação, Server Actions, metadados, logs, erros.
- **Requer:** `npm run dev` rodando para conectar.

## filesystem
- **Uso:** Leitura/escrita de arquivos do projeto (código, configs).
- **Escopo:** apenas a pasta do projeto (`c:\wamp64\www\financas`).

## fetch
- **Uso:** Buscar conteúdo de URLs (documentação, APIs) e converter para markdown.

## mysql
- **Uso:** Consultas **somente leitura** (SELECT, SHOW, DESCRIBE) no MySQL.
- **Config:** variáveis `LOCAL_DB_*` em `.cursor/mcp.json`.  
  **Senha:** defina `LOCAL_DB_PASS` em **Cursor → Settings → Tools & MCP → mysql → Environment** (não deixe senha no JSON).

Depois de alterar `mcp.json`, recarregue a janela do Cursor (Command Palette → “Developer: Reload Window”).
