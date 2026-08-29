# Autenticação — IADMPMA

**Data:** 29/08/2026

---

## Stack

| Componente | Tecnologia | Versão |
|---|---|---|
| Auth Library | NextAuth.js | 5.0.0-beta.32 |
| Provider | Credentials (email + senha) | — |
| Session | JWT | — |
| ORM | Prisma | 5.22.0 |
| Banco | Neon PostgreSQL | — |
| Senha Hash | bcryptjs | 3.0.3 |

---

## Fluxo de Login

```
1. Usuário acessa /admin/login
2. Preenche email + senha
3. Frontend chama signIn('credentials', { email, password, redirect: false })
4. NextAuth chama authorize() em auth.ts
5. authorize() busca usuário no banco via Prisma
6. Verifica se usuário existe e está ativo
7. Compara senha com bcrypt.compare()
8. Se válido, retorna { id, email, name, role }
9. NextAuth cria JWT com dados do usuário
10. Cookie 'authjs.session-token' é definido
11. Frontend redireciona para /admin
12. Middleware verifica cookie em rotas /admin/*
```

---

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | SIM | String de conexão Neon PostgreSQL |
| `NEXTAUTH_SECRET` | SIM | Secret para assinar JWTs (mínimo 32 caracteres) |
| `NEXTAUTH_URL` | SIM | URL base do site (http://localhost:3000 ou https://admpma.vercel.app) |

---

## Configuração

### auth.ts

- **Provider:** Credentials
- **Session:** JWT (não database session)
- **Trust Host:** true (necessário para Vercel)
- **Custom Pages:** signIn → `/admin/login`

### Middleware

- Protege todas as rotas `/admin/*`
- Verifica cookie `authjs.session-token`
- Redireciona para `/admin/login` se não autenticado
- Permite acesso à página de login sem autenticação

---

## Usuários

### Admin Padrão

| Campo | Valor |
|---|---|
| Email | admin@iadmp.com.br |
| Senha | admin123 |
| Role | ADMIN |
| Ativo | true |

> **IMPORTANTE:** Altere a senha após o primeiro login em produção!

### Roles Disponíveis

```
ADMIN           - Acesso total
PASTOR          - Gestão pastoral
SECRETARIA      - Gestão administrativa
FINANCEIRO      - Gestão financeira
LIDER_MINISTERIO - Liderança de ministério
EDITOR_SITE     - Edição do site
MEMBER          - Membro comum
```

---

## Segurança

### Implementado

- Senhas armazenadas com bcryptjs (hash, não texto puro)
- JWT assinado com NEXTAUTH_SECRET
- Cookie HttpOnly (padrão NextAuth)
- Middleware protege rotas admin
- Mensagens de erro genéricas (não expõem detalhes)

### Pendente (Produção)

- NEXTAUTH_SECRET deve ser forte (gerado via crypto)
- Rate limiting no login
- Logout server-side
- Expiração de sessão configurada

---

## Cookies

| Cookie | Ambiente | Descrição |
|---|---|---|
| `authjs.session-token` | Development | Sessão JWT |
| `__Secure-authjs.session-token` | Production (HTTPS) | Sessão JWT segura |

---

## Troubleshooting

### Login não funciona

1. Verifique se `NEXTAUTH_URL` está configurado
2. Verifique se `NEXTAUTH_SECRET` está definido
3. Verifique se o usuário existe no banco
4. Verifique se a senha está correta
5. Verifique os logs do servidor

### Erro "Configuration"

Geralmente significa que `NEXTAUTH_SECRET` não está definido.

### Cookie não é definido

Verifique se `NEXTAUTH_URL` corresponde ao domínio atual.

---

## Para Vercel

### Variáveis obrigatórias

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<gerar com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
NEXTAUTH_URL=https://admpma.vercel.app
```

### Notas

- `trustHost: true` está habilitado no auth.ts
- Cookie `__Secure-*` é usado automaticamente em HTTPS
- `NEXTAUTH_URL` deve ser a URL exata do deploy
