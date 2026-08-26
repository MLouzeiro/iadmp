# Arquitetura Proposta

**Data:** 26/08/2026

---

## Visão Geral

Sistema unificado de gestão da igreja, monolito Next.js, deploy na Vercel.

```
                    SISTEMA IADMP
                         │
             ┌───────────┴───────────┐
             │                       │
        SITE PÚBLICO             /ADMIN
             │                       │
             │              ┌────────┼─────────┐
             │              │        │         │
          História       Membros  Eventos  Financeiro
          Liderança      Líderes  Agenda   Liturgia
          Galeria       Ministérios Avisos Relatórios
          Eventos       Oportunidades Conteúdo
             │                       │
             └───────────┬───────────┘
                         │
                     PRISMA ORM
                         │
                    PostgreSQL
                    (Neon/Vercel)
```

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js | 16.x (App Router) |
| React | React | 19.x |
| Linguagem | TypeScript | 7.x |
| ORM | Prisma | 5.22.x |
| Banco | PostgreSQL | Neon/Vercel Postgres |
| Auth | NextAuth | 5.x (beta) |
| Validação | Zod | 4.x |
| Ícones | lucide-react | 1.33.x |
| CSS | CSS puro + variáveis | — |
| Fonte | Montserrat | Google Fonts |
| Deploy | Vercel | — |

---

## Estrutura de Pastas

```
iadmpma/
├── prisma/
│   ├── schema.prisma        # Schema unificado
│   └── seed.js              # Seed completo
├── public/
│   └── images/              # Imagens da igreja
├── src/
│   ├── app/
│   │   ├── page.tsx         # Home
│   │   ├── sobre/           # História
│   │   ├── lideranca/       # Liderança
│   │   ├── eventos/         # Eventos
│   │   ├── galeria/         # Galeria
│   │   ├── contato/         # Contato
│   │   ├── admin/           # Painel administrativo
│   │   │   ├── layout.tsx   # Layout admin (sidebar)
│   │   │   ├── page.tsx     # Dashboard
│   │   │   ├── login/       # Login
│   │   │   ├── membros/     # CRUD Membros
│   │   │   ├── lideranca/   # CRUD Liderança
│   │   │   ├── eventos/     # CRUD Eventos
│   │   │   ├── financeiro/  # CRUD Financeiro
│   │   │   ├── liturgia/    # CRUD Liturgia
│   │   │   ├── avisos/      # CRUD Avisos
│   │   │   ├── galeria/     # CRUD Galeria
│   │   │   ├── agenda/      # CRUD Agenda
│   │   │   └── opportunidades/ # CRUD Oportunidades
│   │   └── api/
│   │       ├── auth/        # NextAuth
│   │       ├── membros/     # API Membros
│   │       ├── lideranca/   # API Liderança
│   │       ├── eventos/     # API Eventos
│   │       ├── financeiro/  # API Financeiro
│   │       ├── liturgia/    # API Liturgia
│   │       ├── avisos/      # API Avisos
│   │       ├── galeria/     # API Galeria
│   │       ├── agenda/      # API Agenda
│   │       └── dashboard/   # API Dashboard/KPIs
│   ├── components/
│   │   ├── layout/          # Navbar, Footer, ThemeToggle
│   │   ├── ui/              # Card, SectionHead, Button
│   │   ├── home/            # Seções da home
│   │   └── admin/           # Componentes do admin
│   ├── lib/
│   │   ├── prisma.ts        # Singleton Prisma
│   │   ├── auth.ts          # NextAuth config
│   │   └── validations.ts   # Schemas Zod
│   ├── middleware.ts         # Proteção de rotas
│   └── types/               # Tipos TypeScript
├── .env                     # Variáveis de ambiente
├── next.config.js           # Configuração Next.js
├── tsconfig.json            # TypeScript
└── package.json             # Dependências
```

---

## Modelo de Dados (Simplificado)

```
User ──┐
       │
Membro ─┼── Ministerio
       │── Departamento
       │── Familia
       │── Igreja
       │
Lideranca ── Membro
       │── Ministerio
       │
Evento ── CategoriaEvento
       │── EventoParticipante ── Membro
       │── TarefaEvento
       │── Campanha
       │── EventoFinanceiro ── CategoriaFinanceira
       │── Avaliacao ── User
       │── Liturgia ── LiturgiaItem
       │── Agenda
       │── GaleriaItem ── GaleriaAlbum
       │
Aviso
Oportunidade
```

---

## Autenticação

```
Login (/admin/login)
    │
    ├── NextAuth v5
    │   ├── Credentials Provider
    │   ├── DB Lookup (prisma.user.findUnique)
    │   └── bcrypt compare
    │
    ├── JWT Token
    │   ├── userId
    │   ├── email
    │   └── role
    │
    └── Middleware (/admin/*)
        ├── Verifica cookie
        ├── Redireciona se não autenticado
        └── Verifica role (futuro)
```

---

## Fluxo de Dados — Site Público

```
Visitante acessa /eventos
    │
    ├── Server Component
    │   └── prisma.evento.findMany({ where: { publicarNoSite: true } })
    │
    └── Renderiza lista de eventos
```

---

## Fluxo de Dados — Admin

```
Admin acessa /admin/membros
    │
    ├── Middleware verifica auth
    │
    ├── Client Component
    │   ├── fetch('/api/membros')
    │   │   └── API verifica JWT
    │   │       └── prisma.membro.findMany()
    │   │
    │   └── Renderiza tabela
    │
    └── CRUD
        ├── POST /api/membros (criar)
        ├── PUT /api/membros/[id] (atualizar)
        └── DELETE /api/membros/[id] (soft-delete)
```

---

## Segurança

1. **Todas as API routes** protegidas por NextAuth
2. **Middleware** verifica autenticação em `/admin/*`
3. **Rate limiting** no login
4. **Secret seguro** em produção
5. **Sem credenciais hardcoded**
6. **Validação Zod** em todas as entradas
7. **Soft-delete** para membros (não deleta dados)
8. **Sem exposição de secrets** no frontend

---

## Deploy

1. **Vercel** — Deploy automático via Git
2. **Build:** `npx prisma generate && npx next build`
3. **Variáveis:** DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
4. **Preview:** Deploy automático em PRs
5. **Produção:** Branch main
