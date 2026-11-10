# Auditoria do Projeto Atual — IADMPMA

> **Fase 1 — Auditoria read-only.** Este documento descreve o estado real do projeto na data da auditoria (branch `feat/novo-layout-home`). Nenhum arquivo de código, banco ou deploy foi alterado durante esta fase.

---

## 1. Resumo executivo (para leitura rápida)

O projeto **não é mais o CRUD simples** descrito nos documentos antigos. Ele já evoluiu para uma plataforma razoavelmente completa, com:

- **Multi-tenant real** (`Organizacao` + `Congregacao`) com isolamento por escopo nas rotas de API.
- **Painel administrativo grande** (≈37 páginas) cobrindo membros, liderança, eventos, financeiro, liturgia, comunicação, galeria, banners, ministérios, publicações, organizações, gestão, relatórios e configurações.
- **Site público** com portal geral e páginas por congregação em `/igreja/[slug]`.
- **CMS parcial** (`PaginaPublica`, `Publicacao`, `Banner`, `CanalOficial`, `Pregacao`, `VersiculoDiario`).
- **Storage de imagens** via Supabase, com monitoramento de uso e alertas.
- **Auditoria** (`AuditLog`) já chamada em 43 pontos de rotas de API.
- **RBAC** por permissões `modulo:acao`, perfis e vínculo usuário↔organização.

**Situação de qualidade (medida agora):**

| Verificação | Resultado |
|---|---|
| Testes automatizados (`npx jest`) | ✅ **28 suítes / 387 testes passando** |
| Checagem de tipos (`npx tsc --noEmit`) | ❌ **16 erros de TypeScript** em 5 arquivos |
| Build de produção (`next build`) | Não executado nesta fase (o `next.config.js` ignora erros de tipo) |
| `npm run lint` | Não executado nesta fase (auditoria anterior relatou ~135 problemas) |

> **Ponto de atenção nº 1:** o `next.config.js` tem `typescript.ignoreBuildErrors: true`. Isso significa que o build pode passar mesmo com os 16 erros de tipo. É uma dívida técnica real e precisa ser corrigida antes de congelar a v2.

---

## 2. O que funciona hoje (comprovado por teste)

- Login por credenciais e sessão JWT (`next-auth` v5 beta).
- RBAC: `requireAuth`, `requireSuperAdmin`, `hasPermission`, `canAssignRole`.
- Isolamento por organização em membros, eventos, usuários e publicações (testes `isolamento-*`, `idor-organizacao`, `usuarios-escopo`).
- Rotas públicas servindo conteúdo sem sessão e filtrando por organização ativa + site público (`public-*`).
- Auditoria de ações sensíveis (`auditoria.test.ts`).
- Storage: validação de tamanho/tipo, sanitização de nome e monitoramento de uso (`storage-monitoramento`, `storage.test.ts`).
- Indicadores de gestão e liderança (`gestao-indicadores`, `lideranca-indicadores`).
- Health check sem vazar valores de env (`health.test.ts`).

---

## 3. O que está quebrado ou inconsistente (corrigir antes da clonagem)

### 3.1 Erros de TypeScript (16) — bloqueiam uma checagem de tipos limpa

| Arquivo | Qtde | Natureza |
|---|---|---|
| `src/app/admin/publicacoes/page.tsx` | 8 | `ModalField` sem `rows`; `SearchBar` sem `style`; `BadgeVariant` com `"error"` (esperado `"err"`); `ChevronLeft`/`ChevronRight` não importados; `Modal` sem prop `size`. |
| `src/app/api/publicacoes/[id]/route.ts` | 5 | `publicadoPor` inexistente no include; `destinos` inexistente no tipo; `organizacoesIds` possivelmente `undefined`; campo `req` não existe em `AuditLogCreateInput`. |
| `src/components/ui/Modal.tsx` | 1 | `classNames` recebendo `string[]` onde se espera string. |
| `src/app/admin/relatorios/RelatoriosClient.tsx` | 1 | Variante `"default"` não existe em `Button` (esperado `"primary"`). |
| `src/app/api/indicadores/lideranca-detalhada/route.ts` | 1 | `situacao: string` não é aceito por `FiltrosLiderancaDetalhada`. |

**Impacto:** o módulo de **Publicações** (peça central do fluxo de aprovação/publicação) tem a maior dívida de tipos. Deve ser tratado como prioridade de correção.

### 3.2 Inconsistência de dependências (Prisma)

- `@prisma/client` e `prisma` estão em **^5.22.0**.
- `@prisma/adapter-neon` está em **^7.9.1** e `@neondatabase/serverless` em **^1.1.0**.
- `src/lib/prisma.ts` instancia `PrismaClient` **sem adapter**, apesar de `previewFeatures = ["driverAdapters"]`.
- **Risco:** dependências de gerações diferentes convivendo; o adapter instalado não é usado. Decidir: (a) usar o adapter corretamente e alinhar versões, ou (b) remover as dependências não usadas.

### 3.3 Slug da home (verificado — não é quebra, mas é frágil)

- `src/app/page.tsx:17` fixa `const slugPortal = 'iadmp-sede'`.
- `prisma/seed.js:155` cria a organização com slug **`iadmp-central`**.
- **Verificado no branch `v2-dev` (cópia de produção):** existem **três** organizações ativas — `iadmp-sede`, `iadmp-vilasarney` e `iadmp-central`. Portanto a home resolve corretamente hoje.
- **Ainda assim:** o slug hardcoded é frágil (depende de um registro específico). Na v2 deve vir de configuração/banco.

### 3.4 Conteúdo institucional hardcoded

- `src/data/site-data.ts` (`churchData`, `navigation`, `socialLinks`, `programs`) e a própria `src/app/page.tsx` ainda têm conteúdo fixo.
- Parte do site público usa componentes `'use client'` com `fetch(...)` em `useEffect`, **sem SSR/ISR** → impacto em SEO e performance (tratar na Fase 13).

### 3.5 Segurança / configuração

- `next.config.js` → `images.remotePatterns: [{ hostname: '**' }]` permite qualquer host. Restringir aos domínios reais (Supabase, etc.).
- `typescript.ignoreBuildErrors: true` mascara os 16 erros.
- `src/middleware.ts` protege `/admin/:path*` apenas verificando **existência do cookie**, sem checar role/permissão. A autorização fina acontece nas rotas/helpers, mas o middleware sozinho não é barreira de autorização.

### 3.6 Arquivos soltos no repositório

- `opencode.json` deletado (`D`) na working tree, com vários `opencode.json.backup*` não versionados e `public/mockup.html` não versionado.
- `scripts/temp-*.js` (6 arquivos temporários) na raiz de `scripts/` — avaliar remoção/limpeza (sem apagar agora; apenas registrar).

---

## 4. Riscos e verificações pendentes

| # | Risco | Severidade | Ação sugerida |
|---|---|---|---|
| R1 | 16 erros de TypeScript mascarados pelo build | Alta | Corrigir e reativar checagem de tipos antes da v2 |
| R2 | Adapter Prisma incompatível/não usado | Alta | Alinhar versões e ativar adapter ou remover |
| R3 | Slug `iadmp-sede` hardcoded (frágil) | Baixa | Verificado: existe em produção; remover hardcode na v2 |
| R4 | `hostname: '**'` em imagens | Média | Restringir domínios |
| R5 | Conteúdo hardcoded fora do CMS | Média | Migrar para `PaginaPublica`/configurações |
| R6 | Site público sem SSR (SEO) | Média | Migrar fetch para Server Components/ISR |
| R7 | Middleware só checa cookie | Média | Complementar checagem (defesa em profundidade) |
| R8 | Produção com 500 por `DATABASE_URL` (histórico) | Média | Conferir env vars na Vercel antes de deploy |
| R9 | Arquivos `temp-*` e backups soltos | Baixa | Limpeza organizada |
| R10 | Slug/tenant não verificado em produção | Média | Verificação read-only autorizada |

---

## 5. Inventário quantitativo

- **Rotas de API:** ~78 arquivos `route.ts`.
- **Páginas do painel:** ~37 (`src/app/admin/**`).
- **Páginas públicas:** 15 (`/`, `/sobre`, `/contato`, `/eventos`, `/eventos/[id]`, `/galeria`, `/lideranca`, `/pregacoes`, `/pregacoes/[slug]` e `/igreja/[slug]/**`).
- **Modelos Prisma:** ~45 `model` + 9 `enum`.
- **Testes:** 28 suítes, 387 testes (API, lib, componentes/hooks).
- **Libs internas:** `auth`, `auth-helpers`, `tenant`, `audit`, `storage`, `supabase`, `prisma`, `validations`, `indicadores`, `datas`, `pix`, `qrcode`, `versiculos-temas`, entre outras.

---

## 6. Conclusão da Fase 1

O projeto está **funcional e bem mais maduro** do que a documentação antiga indica. É viável evoluir para a v2 por **clonagem**, reaproveitando a maior parte do código. Os bloqueios para uma v2 sólida são pontuais e concentrados: **(1)** corrigir os 16 erros de tipo, **(2)** resolver a inconsistência do Prisma/adapter, **(3)** eliminar o hardcode de slug e conteúdo, **(4)** endurecer configuração (imagens, middleware). Nenhuma ação de correção foi executada nesta fase, conforme as regras.

> **Aguardando aprovação explícita** para iniciar a Fase 2 (clonagem para `iadmp-portal-v2`).
