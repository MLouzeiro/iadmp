# Regras de Segurança (valem para qualquer agente)

## Nunca expor segredos
- Nunca logar tokens de sessão, `NEXTAUTH_SECRET`, `DATABASE_URL` ou senhas no console ou em responses de erro
- `console.log(req.headers)` ou similar em API routes expõe cookies de sessão no log serverless — proibido
- `passwordHash` (ou qualquer hash) **nunca** pode aparecer em response — sempre `select` explícito ou remoção do objeto
- `GET /api/health` só pode informar SET/NOT SET de env vars, nunca o valor

## Nunca confiar no cliente
- `role`, `id`, `organizacoes` ou permissões vindos do body/query **NUNCA** autorizam nada — sempre extrair da sessão via `await auth()` / `requireAuth()` / `getSessionUser()`
- Usuário só pode atribuir roles de nível inferior ao seu — validar com `canAssignRole(requesterId, targetRole)`
- Usuário não-SUPER_ADMIN só opera nas organizações vinculadas — escopo via `UsuarioOrganizacao` / `canManageOrganization()`

## Nunca vazar detalhes internos
- Erros de banco (`PrismaClientKnownRequestError`) nunca devem ser retornados ao cliente — sempre cair no `catch` genérico com 500
- Stack traces nunca aparecem em responses de API, nem em desenvolvimento

## Privilege escalation
- Nenhum endpoint pode permitir que um usuário altere seu próprio `role` ou conceda permissões a si mesmo sem passar por `canAssignRole`/`hasPermission`
- Usuários inativos (`ativo: false`) não podem logar — o `authorize` do NextAuth já bloqueia; manter essa checagem
- Rotas de `/api/usuarios`, `/api/permissoes`, `/api/perfis` exigem sessão + permissão do módulo `usuarios`
