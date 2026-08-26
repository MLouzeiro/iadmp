# Plano de Unificação

**Data:** 26/08/2026

---

## Objetivo

Unificar os projetos **Website** e **IADMP-Sistemas** em um único sistema profissional de gestão da igreja.

---

## O que será mantido do WEBSITE

1. **Páginas públicas** — Home, Sobre, Galeria, Liderança, Contato
2. **Versículo diário** — 31 versículos com reflexão
3. **Tema dark/light** — CSS custom properties
4. **Design system CSS** — Variáveis, componentes, responsividade
5. **Componentes de UI** — Card, SectionHead, Navbar, Footer
6. **Imagens** — Todas as ~100+ imagens existentes
7. **Conteúdo** — Textos, líderes, programas, FAQs, congregações
8. **Prisma Schema** — 15+ modelos (será base do novo schema)
9. **API Routes** — Endpoints de eventos, avaliações, dashboard
10. **Scripts** — Versículo diário (WhatsApp)

---

## O que será mantido do IADMP-SISTEMAS

1. **Lógica de Auth** — JWT, middleware, RBAC (adaptada para NextAuth)
2. **CRUD de Membros** — Completo com paginação, filtros, soft-delete
3. **CRUD de Congregações** — Com hierarquia sede/filiais
4. **Importação CSV** — De membros
5. **Geração de PDF** — Carteirinha de membro
6. **Testes de integração** — 18 testes (adaptados)
7. **Validações Zod** — Todas as regras de negócio
8. **Schema simplificado** — Igreja, Familia, Inscricao (será mergeado)
9. **Seed com dados realistas** — Expandido

---

## O que será adaptado

| Item | Origem | Adaptação |
|---|---|---|
| Auth | IADMP-Sistemas | Migrar de JWT puro para NextAuth com DB lookup |
| Roles | Ambos | Unificar nomenclatura (usar do IADMP-Sistemas) |
| Schema Membro | Ambos | Merge: campos do website + igrejaId/familiaId do sistemas |
| Schema Evento | Ambos | Merge: campos detalhados do website + inscrição do sistemas |
| API Routes | Website | Adicionar proteção de auth em todas as rotas |
| Landing Page | IADMP-Sistemas | Componentes Vue→React (já são React) |

---

## O que será refeito

| Item | Motivo |
|---|---|
| Layout admin | Design moderno, sidebar profissional |
| Dashboard | KPIs unificados (membros, eventos, financeiro, avisos) |
| CRUD Financeiro | Schema existe em ambos, mas nenhum tem implementação |
| CRUD Liturgia | Só existe no website (schema), sem implementação |
| CRUD Avisos | Só existe no website (schema), sem implementação |
| CRUD Galeria | Só existe no website (schema), sem implementação |
| CRUD Agenda | Só existe no website (schema), sem implementação |
| CRUD Oportunidades | Só existe no website (schema), sem implementação |

---

## O que será descartado

| Item | Motivo |
|---|---|
| Código CRA legado (_legacy/, build/) | Obsoleto, substituído por Next.js |
| CSS duplicado (index.css) | Substituído por globals.css |
| Componente Card.jsx (JS) | Substituído por Card.tsx |
| react-scripts, react-router-dom | Não utilizados no Next.js |
| EmailJS | Substituído por API de cadastro |
| Backend Express separado | Substituído por API Routes do Next.js |
| Vite config | Substituído por Next.js |
| Hardcoded admin credentials | Substituído por DB lookup |

---

## Como os bancos serão tratados

1. **Schema unificado** — Merge dos dois schemas Prisma em um só
2. **Provider:** PostgreSQL (manter Neon para dev, Vercel Postgres para prod)
3. **Uma única tabela por entidade** — Evitar duplicação
4. **Migração cuidadosa** — `prisma db push` para desenvolvimento
5. **Seed expandido** — Dados reais da igreja + dados de exemplo

---

## Como o Supabase será utilizado

**Nesta fase, NÃO utilizar Supabase.**

O projeto atualmente usa:
- PostgreSQL via Neon (website)
- PostgreSQL via Prisma (sistemas)

**Futuramente** (após validação):
- Avaliar migração para Vercel Postgres (já integrado ao Vercel)
- Supabase pode ser considerado para: Auth, Storage, Realtime
- Mas NÃO será implementado sem autorização explícita

---

## Como os usuários serão tratados

1. **NextAuth v5** com credentials provider
2. **DB lookup** (prisma.user.findUnique)
3. **Roles unificadas:**
   ```
   ADMIN_GERAL, PASTOR, SECRETARIO, TESOUREIRO, LIDER_CONGREGACAO, EDITOR_SITE, MEMBER
   ```
4. **Middleware** protege todas as rotas `/admin/*`
5. **Cadastro** via API (não formulário EmailJS)
6. **Recuperação de senha** — implementar

---

## Como o Storage será utilizado

1. **Imagens existentes** — manter em `public/images/`
2. **Fotos de membros** — futuramente usar Vercel Blob ou S3
3. **Flyers** — futuramente usar Vercel Blob ou S3
4. **Galeria** — imagens em `public/images/` inicialmente
5. **NÃO implementar upload nesta fase**

---

## Como será feita a integração entre site e painel

```
SITE PÚBLICO (/)
    │
    ├── Dados do banco (API Routes)
    │   ├── Eventos → /eventos (público)
    │   ├── Avisos → home (público)
    │   ├── Liderança → /lideranca (público)
    │   └── Galeria → /galeria (público)
    │
    └── CMS via Admin
        ├── Admin cadastra evento → Aparece no site
        ├── Admin cadastra aviso → Aparece no site
        ├── Admin cadastra líder → Aparece no site
        └── Admin cadastra foto → Aparece na galeria

PAINEL ADMIN (/admin)
    │
    ├── NextAuth (autenticação)
    ├── API Routes (CRUD)
    └── Prisma (banco)
```

---

## Como será feita a publicação na Vercel

1. **Repositório Git** — Um único repositório
2. **Build:** `npx prisma generate && npx next build`
3. **Variáveis de ambiente:** DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
4. **Prod:** https://iadmp.vercel.app
5. **Preview:** Deploy automático em PRs
6. **Middleware:** Protege `/admin/*` em produção

---

## Cronograma

| Fase | Descrição | Status |
|---|---|---|
| Fase 1 | Auditoria completa | CONCLUÍDA |
| Fase 2 | Redesign do site público | EM ANDAMENTO |
| Fase 3 | Schema unificado + migração | Pendente |
| Fase 4 | Auth unificada (NextAuth) | Pendente |
| Fase 5 | Admin layout + dashboard | Pendente |
| Fase 6 | Módulos CRUD (membros, eventos, etc.) | Pendente |
| Fase 7 | Financeiro | Pendente |
| Fase 8 | Liturgia, Avisos, Galeria, Agenda | Pendente |
| Fase 9 | Testes + deploy | Pendente |
