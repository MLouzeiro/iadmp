# Autenticação Atual

**Data:** 26/08/2026

---

## Website — NextAuth v5 Beta

### Configuração
- **Lib:** next-auth ^5.0.0-beta.32
- **Provider:** Credentials (email + password)
- **Session:** JWT
- **Página de login:** `/gestao/login`
- **Secret:** `NEXTAUTH_URL_SECRET` (valor placeholder)

### Fluxo
1. Usuário acessa `/gestao/login`
2. Formulário chama `signIn('credentials', {email, password})`
3. NextAuth verifica no banco (ou hardcoded)
4. Retorna JWT com role
5. Middleware verifica cookie `next-auth.session-token`

### Problemas
1. **Admin hardcoded** no código (bypass total do DB)
2. **API routes não protegidas** — qualquer pessoa pode criar/deletar dados
3. **Secret placeholder** — inseguro para produção
4. **Beta** — pode ter bugs e breaking changes

### Roles (Schema)
```
ADMIN, PASTOR, SECRETARIA, FINANCEIRO, LIDER_MINISTERIO, EDITOR_SITE, MEMBER
```

### Rotas Protegidas
- `/gestao/*` → requer token
- `/gestao/login` → livre

---

## IADMP-Sistemas — JWT Customizado

### Configuração
- **Lib:** jsonwebtoken ^9.0.2
- **Provider:** Credentials (email + password)
- **Expiração:** 24 horas
- **Secret:** `JWT_SECRET` (fallback: `'default-secret'`)

### Fluxo
1. Usuário chama `POST /auth/login` com `{email, senha}`
2. Backend verifica email+senha via bcrypt
3. Retorna `{token, usuario}`
4. Frontend salva em localStorage (`iadmp_token`)
5. Todas as requisições usam `Authorization: Bearer <token>`
6. Middleware `auth.middleware.ts` verifica JWT
7. Middleware `authorize(...perfis)` verifica role

### Roles
```
ADMIN_GERAL, PASTOR, SECRETARIO, TESOUREIRO, LIDER_CONGREGACAO
```

### Rotas e Permissões
| Rota | Roles Permitidos |
|---|---|
| POST /auth/register | Qualquer autenticado |
| POST /igrejas | ADMIN_GERAL, PASTOR |
| PUT /igrejas/:id | ADMIN_GERAL, PASTOR |
| POST /membros | ADMIN_GERAL, PASTOR, SECRETARIO |
| PUT /membros/:id | ADMIN_GERAL, PASTOR, SECRETARIO |
| DELETE /membros/:id | ADMIN_GERAL, PASTOR |
| POST /membros/import | ADMIN_GERAL, PASTOR, SECRETARIO |
| GET /membros/:id/carteirinha | Qualquer autenticado |

### Ausências
- Sem recuperação de senha
- Sem logout server-side (só remove do localStorage)
- Sem token blacklist
- Sem rate limiting no login
- Sem verificação de email

---

## Comparação

| Aspecto | Website | IADMP-Sistemas |
|---|---|---|
| Lib | NextAuth v5 beta | jsonwebtoken |
| Storage | Cookie (session-token) | localStorage |
| Roles | 7 (detalhadas) | 5 (simplificadas) |
| API protegida | Não | Sim |
| RBAC | Básico | Detalhado por rota |
| Cadastro | Formulário EmailJS | API /auth/register |
| Senhas | bcryptjs | bcryptjs |

---

## Recomendação para o Sistema Unificado

1. **Usar NextAuth** (já integrado ao Next.js)
2. **Migrar roles** do IADMP-Sistemas (ADMIN_GERAL, PASTOR, SECRETARIO, TESOUREIRO, LIDER_CONGREGACAO)
3. **Proteger todas as API routes** com middleware
4. **Implementar cadastro** via API (não EmailJS)
5. **Adicionar recuperação de senha**
6. **Rate limiting** no login
7. **Secret seguro** para produção
