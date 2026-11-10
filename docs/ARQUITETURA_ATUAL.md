# Arquitetura Atual — IADMPMA

> Documento da Fase 1 (auditoria read-only). Descreve como o sistema está montado hoje, de forma simples e com caminhos de arquivo.

---

## 1. Visão de alto nível

O sistema é um **monólito Next.js (App Router)** com:

- **Frontend público** (site da igreja + páginas por congregação).
- **Painel administrativo** (`/admin`) protegido por login.
- **API Routes** (`/api/**`) usadas tanto pelo painel quanto pelo site público.
- **PostgreSQL** (Neon) acessado via **Prisma**.
- **Supabase Storage** para imagens.
- Deploy na **Vercel**.

```
Navegador
  ├── Site público  (src/app/(páginas públicas))
  └── Painel /admin (src/app/admin/**)
            │  fetch + JWT (cookie authjs.session-token)
            ▼
        API Routes (src/app/api/**)
            │  Prisma
            ▼
       PostgreSQL (Neon)
            │  upload de imagem
            ▼
       Supabase Storage
```

---

## 2. Stack e versões reais

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | `^16.3.2` |
| UI | React 19 | `^19.2.8` |
| Autenticação | next-auth | `^5.0.0-beta.32` |
| ORM | Prisma Client / CLI | `^5.22.0` |
| Driver Neon (instalado, não usado) | `@prisma/adapter-neon` | `^7.9.1` |
| Driver Neon serverless | `@neondatabase/serverless` | `^1.1.0` |
| Storage | `@supabase/supabase-js` | `^2.117.3` |
| Validação | Zod | `^4.4.3` |
| Hash | bcryptjs | `^3.0.3` |
| Ícones | lucide-react | `^1.33.0` |
| Testes | Jest + ts-jest + RTL | `^29.7.0` |

> Ver `package.json`.

---

## 3. Estrutura de pastas (real)

```
/
├── prisma/
│   ├── schema.prisma          # ~45 models + 9 enums
│   ├── seed.js                # perfis, permissões, SUPER_ADMIN, ConfiguracoesIgreja
│   └── migrate-tenant.js      # migração idempotente (não destrutiva)
├── src/
│   ├── middleware.ts          # protege /admin/:path*
│   ├── app/
│   │   ├── layout.tsx         # layout raiz (tema)
│   │   ├── page.tsx           # HOME pública (slug hardcoded 'iadmp-sede')
│   │   ├── sobre/ contato/ eventos/ galeria/ lideranca/ pregacoes/
│   │   ├── igreja/[slug]/     # páginas por congregação
│   │   ├── admin/             # ~37 páginas do painel ('use client')
│   │   └── api/               # ~78 route.ts
│   ├── components/
│   │   ├── ui/                # base (Button, Card, Input, Modal, SearchBar, ...)
│   │   ├── layout/            # Navbar/Footer públicos
│   │   ├── public/            # seções do site
│   │   └── theme/             # ThemeProvider / ClientLayout
│   ├── lib/                   # auth, tenant, audit, storage, prisma, validations...
│   ├── data/site-data.ts      # conteúdo institucional estático
│   ├── hooks/ types/ utils/
├── __tests__/                 # 28 suítes, 387 testes
├── docs/                      # documentação
├── scripts/                   # temp-*.js (utilitários temporários)
├── next.config.js             # ignoreBuildErrors: true; imagens hostname '**'
├── vercel.json
├── tsconfig.json
└── jest.config.ts
```

---

## 4. Autenticação e sessão

- **Arquivo central:** `src/lib/auth.ts`
  - Provider **Credentials** (email + senha com bcryptjs).
  - Estratégia **JWT**.
  - Callback `jwt`/`session` injeta `id`, `role`, `organizacoes`.
  - `pages.signIn = '/admin/login'`.
- **Cookie:** `authjs.session-token`.
- **Helpers:** `src/lib/auth-helpers.ts`
  - `getSessionUser()`, `requireAuth()`, `requireSuperAdmin()`, `hasPermission(userId, modulo, acao)`.
  - `canAssignRole()` (hierarquia de roles).
  - `getUserOrganizations()`, `getUserPermissions()`, `canManageOrganization()`.
- **Middleware:** `src/middleware.ts` — matcher `['/admin/:path*']`, checa apenas a **presença do cookie** (não valida role).

### Hierarquia de roles

`SUPER_ADMIN > ADMIN_IGREJA(90) > PASTOR(85) > LIDER/COORDENADOR(60) > SECRETARIA/FINANCEIRO/EDITOR_SITE(50) > MUSICO(20) > MEMBER(10)`.

`canAssignRole()` só permite atribuir roles de nível inferior ao do usuário.

---

## 5. Multi-tenant (escopo por organização)

- **Arquivo:** `src/lib/tenant.ts`
- **Conceitos:**
  - `Organizacao` = igreja/congregação com `slug` e `sitePublico`.
  - `Congregacao` = unidade subordinada.
  - Vínculo usuário↔organização em `UsuarioOrganizacao`.
- **Funções:**
  - `resolveOrgScope(user, organizacaoId)` → modo `SINGLE` / `MULTI` / `ALL`.
  - `resolveTargetOrgId(user, organizacaoId)` → organização-alvo validada.
  - `resolveCongregacaoId(...)`.
  - `resolvePublicOrganizacaoId({ slug, organizacaoId })` → resolve org pública **ativa e com site habilitado**.
  - Constantes `ORG_FORBIDDEN`, `ORG_REQUIRED`; `orgForbiddenResponse()`.
- **Regra:** `SUPER_ADMIN` enxerga todas as organizações (`ALL`); usuários comuns ficam no seu escopo (`SINGLE`/`MULTI`).

---

## 6. Autorização por permissões (RBAC)

- Formato `modulo:acao` (ex.: `membros:criar`, `usuarios:ver_auditoria`).
- Tabelas: `Perfil`, `Permissao`, `PerfilPermissao`, `UsuarioPermissao`.
- Checagem nas rotas: `hasPermission(user.id, 'modulo', 'acao')`.
- **Nunca** confiar em `role`/`id` vindos do body — sempre extrair da sessão.

---

## 7. Auditoria

- **Arquivo:** `src/lib/audit.ts`
- `writeAudit(...)` grava em `AuditLog`.
- `AUDIT_ACOES` centraliza nomes de ações.
- `extractRequestMeta(request)` captura IP/user-agent.
- **Sanitização** remove campos sensíveis (`password`, `senha`, `hash`, `token`, `secret`, `authorization`, `cookie`, `jwt`).
- **Uso:** 43 chamadas de `writeAudit(` em rotas de API.

---

## 8. Storage (imagens)

- **Arquivos:** `src/lib/storage.ts`, `src/lib/supabase.ts`.
- Bucket padrão: `imagens` (`NEXT_PUBLIC_SUPABASE_BUCKET`).
- Upload máximo **5 MB**, apenas MIME de imagem, nome sanitizado (`sanitizarNomeArquivo`).
- `POST /api/upload` exige `organizacaoId`.
- **Monitoramento:** limites de alerta 70% / 85% / 95%; modelos `StorageConfig`, `StorageMeasurement`, `StorageAlert`; rotas `/api/storage/monitoramento`, `/api/storage/limpeza`, `/api/storage/alertas/[id]`.

---

## 9. Fluxo de dados do site público

- Componentes em `src/components/public/**` (muitos `'use client'`).
- Buscam dados via `fetch('/api/public/...?slug=...')` dentro de `useEffect`.
- Rotas públicas filtram por organização ativa + site público.
- **Limitação:** sem SSR/ISR → pior SEO/performance (item da Fase 13).

### Rotas públicas existentes
`church-info`, `footer-info`, `hero-stats`, `congregacoes`, `eventos`, `eventos/[id]`, `galeria`, `lideranca`, `pregacoes`, `pregacoes/[slug]`, `avisos`, `canais`, `versiculo`, `programacao`, `contato`, `ministerios`, `banners`.

---

## 10. Fluxo de publicação (CMS)

- Modelos: `PaginaPublica`, `Publicacao`, `PublicacaoOrganizacao`, `Aprovacao`.
- `Publicacao` pode ter destinos por organização e fluxo de aprovação.
- APIs: `/api/publicacoes`, `/api/publicacoes/[id]`, `/api/pagina-publica`.
- Painel: `/admin/publicacoes` (possui 8 dos 16 erros de tipo — precisa de correção).

---

## 11. Tema e identidade visual

- `src/components/theme/ThemeProvider.tsx` busca `/api/configuracoes` e injeta variáveis CSS no `:root`.
- Paletas em `src/lib/theme-palettes.ts`; doc em `docs/IDENTIDADE_VISUAL.md`.
- CSS Modules + variáveis CSS (sem Tailwind).

---

## 12. Deploy e ambiente

- **Vercel** (`vercel.json`): build `npx prisma generate && npx next build`.
- Envs obrigatórias: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.
- Envs de storage: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_BUCKET`.
- **Histórico:** produção teve 500 por `DATABASE_URL` ausente na Vercel — conferir antes de qualquer deploy.

---

## 13. Dívidas arquiteturais transversais

1. `typescript.ignoreBuildErrors: true` — esconde 16 erros.
2. Prisma 5.x + adapter 7.x não utilizado.
3. Conteúdo hardcoded em `src/data/site-data.ts` e `src/app/page.tsx`.
4. Site público client-side (sem SSR).
5. Middleware frágil (só cookie).
6. `images.remotePatterns` com `hostname: '**'`.
