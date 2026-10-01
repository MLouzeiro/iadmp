# IADMPMA — Sistema de Gestão da Igreja
> Sistema de gestão administrativa e site público da Igreja Assembleia de Deus Ministério da Promessa (IADMP): membros, liderança, eventos, liturgia, comunicação, avisos, galeria, financeiro e usuários, com painel `/admin` protegido e site público.

## Stack
| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js (App Router) |
| Frontend | React 19 + CSS Modules + variáveis CSS (sem Tailwind) |
| Backend | Next.js API Routes (Route Handlers) |
| Banco de dados | PostgreSQL (Neon) via driver adapters |
| ORM | Prisma 5 |
| Autenticação | NextAuth v5 (Credentials + JWT em cookie) |
| Validação | Zod (`src/lib/validations.ts`) |
| Ícones | lucide-react |
| Hospedagem | Vercel |

## Estrutura de pastas

```
/
├── prisma/
│   ├── schema.prisma          # Schema completo (User, Organizacao, Membro, Evento, Liturgia, ...)
│   ├── seed.js                # Seed de perfis, permissões, SUPER_ADMIN e configurações
│   └── migrations/            # Migrations geradas pelo Prisma
├── src/
│   ├── middleware.ts           # Protege /admin/* via cookie authjs.session-token
│   ├── app/
│   │   ├── layout.tsx          # Layout raiz (ThemeProvider/ClientLayout)
│   │   ├── page.tsx            # Home do site público
│   │   ├── globals.css         # Variáveis CSS do tema (--color-primary, --bg-primary, ...)
│   │   ├── not-found.tsx
│   │   ├── admin/              # Painel administrativo ('use client', sidebar própria)
│   │   │   ├── layout.tsx      # Sidebar + navegação por módulo
│   │   │   ├── page.tsx        # Dashboard
│   │   │   ├── login/          # Tela de login (signIn page do NextAuth)
│   │   │   ├── membros/ lideranca/ eventos/ financeiro/ avisos/
│   │   │   ├── galeria/ oportunidades/ usuarios/ configuracoes/
│   │   │   ├── liturgia/        # programações, musicas, modelos, [id], imprimir, modo-culto
│   │   │   └── comunicacao/     # dashboard, canais, pregacoes, versiculos
│   │   ├── contato/ eventos/ galeria/ lideranca/ sobre/   # páginas públicas
│   │   └── api/
│   │       ├── public/          # rotas públicas (church-info, eventos, pregacoes, canais, versiculo)
│   │       ├── auth (via NextAuth handlers em lib/auth.ts)
│   │       ├── membros/ lideranca/ eventos/ avisos/ liturgia/ configuracoes/
│   │       ├── usuarios/ perfis/ permissoes/ organizacoes/
│   │       ├── comunicacao/ (canais, pregacoes, dashboard)
│   │       ├── dashboard/ health/ seed/
│   │       └── admin/versiculos/
│   ├── components/
│   │   ├── ui/                 # Button, Card, Input, Select, Textarea, Checkbox, SearchBar, FormCard, FormGrid, SectionHead
│   │   ├── layout/             # Navbar, Footer (site público)
│   │   ├── public/             # Seções do site (EventosSection, PregacoesSection, ChurchInfo, ...)
│   │   └── theme/              # ThemeProvider, ClientLayout (injeta variáveis CSS do tema)
│   ├── lib/
│   │   ├── prisma.ts           # Instância singleton do Prisma Client
│   │   ├── auth.ts             # NextAuth (providers, jwt/session callbacks, pages.signIn=/admin/login)
│   │   ├── auth-helpers.ts     # getSessionUser, requireAuth, requireSuperAdmin, hasPermission, canAssignRole, ...
│   │   ├── validations.ts      # Schemas Zod de todos os módulos
│   │   └── theme-palettes.ts   # Paletas predefinidas de identidade visual
│   ├── data/site-data.ts       # Conteúdo estático do site público
│   ├── types/next-auth.d.ts    # Augmentation do session (role, id, organizacoes)
│   └── middleware.ts
├── __tests__/
│   ├── api/                    # Testes de integração das API Routes
│   ├── lib/                    # Testes unitários (validations, auth-helpers)
│   ├── hooks/                  # Testes de hooks React
│   └── components/             # Testes de componentes (Jest + RTL)
├── docs/                       # Documentação do projeto (identidade visual, auditorias, planos)
├── .env                        # Variáveis de ambiente (DATABASE_URL, NEXTAUTH_SECRET)
├── .env.example                # Template das variáveis
├── next.config.js
├── jest.config.ts
├── jest.setup.ts
├── tsconfig.json
├── tsconfig.rag.json           # Config do ts-node para os scripts RAG
├── package.json
└── AGENTS.md
```

## Como rodar localmente

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com DATABASE_URL e NEXTAUTH_SECRET

# Criar schema e popular dados
npm run db:push
npm run db:seed

# Rodar em modo desenvolvimento (porta 3000; .env.example usa 3001 para NEXTAUTH_URL)
npm run dev

# Testes
npm test
```

## Padrões de código

- Nomenclatura de componentes: **PascalCase** (`Button.tsx`, `Navbar.tsx`); arquivos utilitários em camelCase (`auth.ts`, `validations.ts`); rotas de API em `route.ts`
- Estrutura de endpoints: `/api/{recurso}` para lista/criação, `/api/{recurso}/[id]` para item específico, verbos HTTP semânticos (GET, POST, PATCH, DELETE)
- Estrutura de componentes: um componente por arquivo, `export default` para páginas, export nomeado para componentes reutilizáveis
- Estilização: CSS Modules (`*.module.css`) + variáveis CSS do tema (`var(--color-primary)`, `var(--bg-card)`, ...) — **não** usar Tailwind nem cores hardcoded
- Tipagem: TypeScript strict, todas as props e retornos de API tipados, schemas Zod em `src/lib/validations.ts`
- Imports: sempre alias `@/` (`@/lib/prisma`, `@/components/ui/Button`)
- Páginas do painel (`src/app/admin/**`) são `'use client'` e consomem a API com `fetch` + `useState/useEffect`

## TDD

- Framework backend: Jest + ts-jest
- Framework frontend: Jest + React Testing Library (jsdom via docblock `@jest-environment jsdom`)
- Onde ficam os testes: `__tests__/api/` (integração), `__tests__/lib/` (unitários), `__tests__/hooks/`, `__tests__/components/`
- Regra: todo endpoint de API e helper de auth/permissão deve ter pelo menos 1 teste antes da implementação
- Testes críticos deste projeto:
  - [ ] Login com credenciais válidas cria sessão; credenciais inválidas retornam erro
  - [ ] `requireAuth()` lança UNAUTHORIZED sem sessão; `requireSuperAdmin()` lança FORBIDDEN para não-SUPER_ADMIN
  - [ ] Membro criado sem `nome` é rejeitado pelo `membroSchema`; criado com dados válidos é persistido
  - [ ] Usuário comum não cria/edita usuários; SUPER_ADMIN pode (RBAC + `canAssignRole`)
  - [ ] Rota `GET /api/public/eventos` responde sem sessão; `GET /api/usuarios` exige sessão

## Nunca fazer

- Nunca expor `passwordHash` (ou qualquer hash) em response de API — sempre `select` sem a senha
- Nunca confiar em `role`, `id` ou permissões vindos do body/query — sempre extrair da sessão via `auth()`/`requireAuth()`/`hasPermission()`
- Nunca usar estado em memória para dados persistentes — tudo vai para o banco via Prisma
- Nunca comitar `.env` com credenciais reais — usar `.env.example` como template
- Nunca editar SQL de migrations manualmente — usar `npm run db:push`/`npx prisma migrate dev`
- Nunca usar cores/fontes hardcoded no frontend — usar as variáveis CSS do tema (`docs/IDENTIDADE_VISUAL.md`)
- Nunca adicionar TanStack Query, Tailwind ou shadcn/ui — a stack é fetch + CSS Modules + componentes próprios em `src/components/ui/`

## Regras por submódulo

### M1 — Autenticação & RBAC (backend-auth, frontend-auth)
- **NextAuth**: `src/lib/auth.ts` exporta `handlers`, `auth`, `signIn`, `signOut`; provider Credentials com bcryptjs; strategy `jwt`; `pages.signIn: '/admin/login'`
- **Sessão**: ler sempre com `await auth()` (server) ou `getSessionUser()`; cookie `authjs.session-token`
- **Helpers**: `requireAuth()` lança `UNAUTHORIZED`; `requireSuperAdmin()` lança `FORBIDDEN`; checar permissão com `hasPermission(userId, modulo, acao)`
- **Hierarquia de roles**: SUPER_ADMIN > ADMIN_IGREJA(90) > PASTOR(85) > LIDER/COORDENADOR(60) > SECRETARIA/FINANCEIRO/EDITOR_SITE(50) > MUSICO(20) > MEMBER(10) — `canAssignRole()` só permite atribuir roles de nível inferior
- **Perfis e permissões**: `Perfil`/`Permissao`/`PerfilPermissao`/`UsuarioPermissao` — formato `modulo:acao` em minúsculas (`membros:criar`)
- **Multi-organização**: escopo por `UsuarioOrganizacao`; SUPER_ADMIN vê todas as organizações
- **Middleware**: `src/middleware.ts` protege `/admin/:path*` verificando o cookie de sessão

### M2 — CRUD dos módulos (backend-crud, frontend-admin)
- **Módulos**: membros, liderança, eventos, avisos, liturgia, galeria, oportunidades, usuários, comunicação (canais/pregações/versículos), configurações
- **Validação**: sempre via schema Zod de `src/lib/validations.ts` antes de criar/editar; erro `400` com `{ error: "mensagem" }`
- **Soft delete/inativação**: preferir flags (`ativo`, `status`, `situacaoAviso`) — não deletar registros com referências
- **Auditoria**: ações sensíveis de usuários podem registrar em `AuditLog`
- **Params Next.js**: `{ params }: { params: Promise<{ id: string }> }` com `await params`
- **PATCH parcial**: montar `data: Record<string, unknown>` apenas com campos enviados

### M3 — Painel & Métricas (backend-metrics)
- **Rotas**: `GET /api/dashboard` e `GET /api/health` agregam dados do painel
- **Regra**: cálculos via Prisma na hora (`count`, `aggregate`, `groupBy`) — nunca cache em memória
- **Health**: `GET /api/health` não pode vazar valores de env (apenas SET/NOT SET)

### Site público (frontend-public)
- **Páginas**: `/`, `/sobre`, `/eventos`, `/galeria`, `/lideranca`, `/contato`
- **Dados**: rotas `src/app/api/public/*` são públicas (sem sessão); conteúdo estático em `src/data/site-data.ts`
- **Seções**: componentes em `src/components/public/` (EventosSection, PregacoesSection, ChurchInfo, VerseOfTheDay, CanaisSection)

### Core & Tema (frontend-core)
- **Componentes base**: `src/components/ui/` (Button, Card, Input, Select, Textarea, Checkbox, SearchBar, FormCard, FormGrid, SectionHead)
- **Tema**: `ThemeProvider` busca `/api/configuracoes` e injeta variáveis CSS no `:root` (`--color-primary: #C8960C`, fundo `#0A1628`, texto `#F0ECE2`); paletas em `src/lib/theme-palettes.ts`; docs em `docs/IDENTIDADE_VISUAL.md`
- **Tipografia**: Playfair Display (títulos) + Montserrat (corpo)
- **Layout público**: Navbar/Footer em `src/components/layout/`

### Infra & Setup (infra)
- **Banco**: PostgreSQL (Neon) — `DATABASE_URL` com driver adapter (`@prisma/adapter-neon`) e `previewFeatures = ["driverAdapters"]`
- **Comandos**: `npm run db:push`, `npm run db:seed`, `npm run db:reset`, `npm run db:studio`
- **Seed**: `prisma/seed.js` cria módulos/permissões, perfis, SUPER_ADMIN e `ConfiguracoesIgreja`
- **Deploy**: Vercel (`vercel.json`); `NEXTAUTH_URL` e `NEXTAUTH_SECRET` como env vars
- **Next config**: `typescript.ignoreBuildErrors: true` está ativo — rodar `npx tsc --noEmit` para checar tipos reais

### RAG — Sistema de Memória (aprendizado contínuo)
- **Banco**: SQLite em `.claude/rag.db` via `better-sqlite3`
- **Scripts em `.claude/scripts/`**:
  - `embedding.ts` — Funções `computeEmbedding` (bigram hash 128d) e `cosineSimilarity`
  - `rag-db.ts` — Singleton SQLite, schema `knowledge`, funções `insertKnowledge`, `searchSimilar`, `getAllKnowledge`
  - `summarize.ts` — Extrai aprendizados de docs (.md) em 4 categorias (bug, decisao_arquitetura, padrao_time, nao_funcionou) e insere no RAG
  - `embed.ts` — Lê diretório/arquivo, chunk, embedding, INSERT (dedup por path)
  - `search.ts` — `npx ts-node -P tsconfig.rag.json .claude/scripts/search.ts <query>` — busca top-5 similar
- **Plugin hooks** (`.opencode/plugin/agent-hooks.ts`):
  - `event` → monitora sessões e mensagens assistant completadas
  - `experimental.session.compacting` → injeta 3 chunks RAG relevantes como contexto de compactação
  - `tool.execute.before` / `command.execute.before` → impede que agents editem arquivos/comandos fora do próprio escopo
- **Como usar**: `npx ts-node -P tsconfig.rag.json .claude/scripts/embed.ts <dir|file>` para popular; `search.ts` para consultar
- **`.gitignore`**: `.claude/rag.db` cobre o banco local

## Decisões em aberto

- [ ] Escopo do módulo financeiro (dízimos vs. eventos com campanha)
- [ ] Multi-igreja: manter `Organizacao` multi-tenant ou simplificar para uma igreja
