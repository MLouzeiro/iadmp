# IMPLEMENTATION_PROGRESS — IADMP (Centro de Gestão + Multi-Tenant)

> **Data:** 03/10/2026 (sessão 2) — **Status:** **FASE 0 + 1 CONCLUÍDAS · FASE 2 (backend + UI principal) CONCLUÍDA**
> **Produção oficial:** `https://admp-ma.vercel.app`
> Este documento existe para retomar o trabalho na próxima sessão. **Não apagar.**

---

## 1. Onde paramos

**Fases 0, 1 e a maior parte da Fase 2 estão implementadas e verificadas.**
Próximo passo: fechar a Fase 2 (drill-down + consolidado/comparativo) e seguir para a **Fase 3 — Pendências + Decisão**.

**Para retomar:** pedir "continuar" e a primeira ação é `GET /api/gestao/indicadores/[grupo]`
(drill-down) + `GET /api/gestao/pendencias` + `GET /api/gestao/observacoes` (Fase 3).

### Fase 0 — o que foi feito (sessão 2)

**Schema (`prisma/schema.prisma`)**
- Novo modelo `Congregacao` (`@@unique([organizacaoId, nome])`).
- `organizacaoId` (obrigatório) + `congregacaoId?` em `Membro`, `Evento`, `Aviso`, `Lideranca`, `Ministerio`, `Departamento`, `Campanha`, `GaleriaAlbum`, `GaleriaItem`, `Oportunidade`, `Agenda`, `EventoFinanceiro`, `Liturgia`, `ConfiguracoesIgreja`.
- `EventoFinanceiro` estendido: `categoria` (`CategoriaLancamento` = DIZIMO/OFERTA/DOACAO/INSCRICAO/DESPESA/OUTRO), `eventoId` agora **opcional**, `organizacaoId`, `congregacaoId?`.
- `UsuarioOrganizacao` += `perfilId`, `ativo`, `updatedAt`.
- `AuditLog` += `organizacaoId`, `antes`, `depois`, `ip`, `userAgent`, `resultado`.
- Novos modelos: `Inscricao`, `Pagamento` (com `estornadoDe`/`estornos`), `Aprovacao` (solicitante/aprovador) + enums `StatusInscricao`, `StatusPagamento`, `FormaPagamento`, `StatusAprovacao`.
- `Membro.congregacao` (string) e `Liturgia.congregacao` (string) **substituídos** por `congregacaoId` + relação.

**Helpers**
- `src/lib/tenant.ts` — `resolveOrgScope`, `assertOrgAccess`, `assertTargetUserScope`, `resolveTargetOrgId`, `resolveCongregacaoId`, `withOrgScope`, `orgFilter`, `orgForbiddenResponse`, erros `ORG_FORBIDDEN` / `ORG_REQUIRED`.
- `src/lib/audit.ts` — `writeAudit` (sanitiza `password|hash|token|secret|...`), `extractRequestMeta` (IP + user-agent). Nunca derruba a requisição.

**Os 9 vazamentos cross-tenant corrigidos (seção 3.3)**
| # | Correção |
|---|---|
| 1 | `GET /api/usuarios?organizacaoId=` agora passa por `assertOrgAccess` |
| 2 | `PUT /api/usuarios/[id]` bloqueia autoedição de `role`/`perfilId`/`permissoes`/`organizacoes`/`ativo` + `assertTargetUserScope` |
| 3 | `PATCH /api/usuarios/[id]/status` usa `assertTargetUserScope` |
| 4 | `POST`/`PUT` de `pregacoes` rejeitam `liturgiaId` de outra `organizacaoId` |
| 5 | `GET /api/public/church-info` aceita `?organizacaoId=` e valida org ativa |
| 6 | `GET /api/public/eventos` filtra por `Evento.organizacaoId` (não mais via `liturgias`) |
| 7 | `membros`, `eventos`, `lideranca`, `avisos`, `dashboard` com escopo por organização |
| 8 | `PUT /api/configuracoes` exige `configuracoes:editar` + `assertOrgAccess`; config agora é por `organizacaoId` (`upsert`) |
| 9 | `GET /api/perfis` e `GET /api/permissoes` exigem `usuarios:visualizar` |

**Escopo aplicado em** membros, eventos, liderança, avisos, dashboard, usuários (+ `[id]`), configurações. Liturgia/comunicação mantiveram o padrão blueprint (que já estava correto).

**Migração de dados**: `prisma/migrate-tenant.js` (idempotente, sem apagar dados).
```
node prisma/migrate-tenant.js   # adiciona colunas, cria org padrao, popula Congregacao, backfill
npm run db:push                 # reconcilia tabelas novas (Inscricao/Pagamento/Aprovacao) + FKs
npm run db:seed
```
> **ATENÇÃO:** a Fase 0 ainda **não foi aplicada no banco de produção**. Rodar os comandos acima antes do próximo deploy.

**Verificação da sessão 2**: `npx jest` → **115 testes, 10 suítes, todos passando**; `npx tsc --noEmit` → limpo; `npm run build` → sucesso.

**Testes novos**
- `__tests__/lib/tenant.test.ts` — `resolveOrgScope`, `assertOrgAccess`, `withOrgScope`/`orgFilter`.
- `__tests__/api/isolamento-membros.test.ts` — IDOR membros + auto-resolução de org + `ACESSO_NEGADO`.
- `__tests__/api/isolamento-eventos.test.ts` — IDOR eventos.
- `__tests__/api/usuarios-escopo.test.ts` — vazamento de `?organizacaoId=`, autoedição, escopo do alvo, role acima do nível.
- `__tests__/api/public-isolamento.test.ts` — `church-info` e `public/eventos` multi-tenant.

**Decisões tomadas na Fase 0 (registrar)**
- `resolveTargetOrgId`: se o usuário tem **exatamente uma** organização, `organizacaoId` no corpo é opcional (mantém a UI atual funcionando); com múltiplas orgs, é obrigatório (`ORG_REQUIRED` → 400).
- `Congregacao` é resolvida por **nome** (`resolveCongregacaoId` faz find-or-create dentro da org) — a UI continua com input de texto.
- `ConfiguracoesIgreja.organizacaoId` é obrigatório; `GET /api/configuracoes` continua **público** (tema do site) e usa a config mais antiga quando não há `organizacaoId`.
- `AuditLog.organizacaoId` é **opcional** (nem todo evento tem org, ex.: login).

### Fase 1 — o que foi feito (sessão 2)

- `src/lib/audit.ts` ganhou `AUDIT_ACOES` (CREATE/UPDATE/DELETE/CANCEL/APPROVE/REJECT/PUBLISH/UNPUBLISH/
  PAY/REFUND/LOGIN/LOGOUT/PERMISSION_CHANGE/CONFIG_CHANGE/ACESSO_NEGADO/TROCA_CONTEXTO).
- `writeAudit` chamado em **todas** as mutações de membros, eventos, liderança, avisos e em
  `PUT /api/configuracoes` (`CONFIG_CHANGE`), com `antes`/`depois` + IP + user-agent.
  `usuarios` já gravava (`CRIAR_USUARIO`/`EDITAR_USUARIO`/`EXCLUIR_USUARIO`).
- `GET /api/gestao/auditoria` (`src/app/api/gestao/auditoria/route.ts`) com filtros
  `organizacaoId`, `userId`, `acao`, `entidade`, `entidadeId`, `dataInicio`, `dataFim`, `page`, `limit`.
  Exige `usuarios:ver_auditoria` e respeita `resolveOrgScope`.
- Permissão `usuarios:ver_auditoria` acrescentada ao seed (`Usuarios` + perfil `ADMIN_IGREJA`).
  **Re-rodar `npm run db:seed` após a migração.**
- Testes: `__tests__/api/auditoria.test.ts` (11 casos — RBAC, escopo, filtros, sanitização de
  `password|hash|token|secret`, `writeAudit` nunca lança, `extractRequestMeta`).

**Verificação da sessão 2 (final)**: `npx jest` → **147 testes, 13 suítes, todos passando**;
`npx tsc --noEmit` → limpo; `npm run build` → sucesso (página `/admin/gestao` + rotas
`/api/gestao/auditoria` e `/api/gestao/indicadores` registradas).

### Fase 2 — o que foi feito (sessão 2, backend)

- `src/lib/indicadores.ts` — **FONTE ÚNICA** de métricas:
  - `resolvePeriodo(tipo, {dataInicio,dataFim})` → `{ label, atual, anterior }` com os períodos
    `hoje|ontem|7d|30d|mes_atual|mes_anterior|trimestre|semestre|ano|personalizado`.
    A janela **anterior** tem a mesma duração e termina imediatamente antes da atual.
  - `parseDataLocal()` interpreta `YYYY-MM-DD` como data **local** (bug de UTC corrigido).
  - `calcularIndicadores(periodo, filtros)` → 18 indicadores em 4 grupos
    (`pessoas`, `eventos`, `financeiro`, `conteudo`), cada um com
    `{ chave, grupo, titulo, valor, periodoAnterior, variacaoPercentual, media6Meses,
       formula, origem, unidade, filtrosAplicados }`.
  - Indicadores de "estoque" (`lideresAtivos`, `canaisAtivos`, `avisosAtivos`, `eventosFuturos`)
    são marcados `semPeriodo` e não têm variação.
  - `indicadoresDashboardLegado` / `indicadoresComunicacaoLegado` mantêm o formato antigo.
- `GET /api/gestao/indicadores?periodo=&dataInicio=&dataFim=&organizacaoId=&congregacaoId=&eventoId=&categoria=&status=` — RBAC (`dashboard:visualizar`) + `resolveOrgScope`.
- `GET /api/dashboard` e `GET /api/comunicacao/dashboard` **delegam ao core** (nada mais é recalculado à parte).
- Testes: `__tests__/lib/indicadores.test.ts` (11 casos) e `__tests__/api/gestao-indicadores.test.ts` (8 casos).

**Pendente da Fase 2 (próxima sessão)**
- ~~Página `/admin/gestao`~~ → **FEITA** (abas, filtro global de período, seletor de organização,
  KPIs com `ⓘ` — fórmula/origem/período/filtros, tabela de indicadores e de auditoria).
  Abas `PENDÊNCIAS`, `TOMADA DE DECISÃO` e `RELATÓRIOS` mostram placeholder das Fases 3/4.
- ~~Filtro global de período~~ → **FEITO** (10 períodos + personalizado com datas locais).
- ~~Seletor de contexto de igreja~~ → **FEITO** (select de `/api/organizacoes` no filtro; "Todas as minhas").
- Consolidado `TOTAL CONSOLIDADO` + `DETALHAMENTO POR IGREJA`, tabela comparativa sem ranking → **pendente**.
- `GET /api/gestao/indicadores/[grupo]` (drill-down) → **pendente**.

---

## 2. Decisões aprovadas pelo responsável

| # | Questão | Decisão |
|---|---|---|
| 1 | Multi-tenant incompleto (membros/eventos/financeiro sem `organizacaoId`) | **Completar o multi-tenant ANTES** de construir o Centro de Gestão |
| 2 | Escopo do "Admin Geral" (item 21 contradizia o documento anterior) | **Visão consolidada multi-igreja** (uma igreja / várias / todas) |
| 3 | Inscrições, pagamentos, PIX, check-in e aprovações não existem | **Criar modelos mínimos agora** (sem gateway PIX — só registro de pagamento) |
| 4 | "IA analítica" | **Heurísticas determinísticas** (sem LLM, sem custo de API, reproduzível) |
| 5 | Exportação | **CSV + impressão** (CSS `@media print`), sem dependência nova |

---

## 3. Auditoria — resumo executivo

### 3.1 FUNCIONANDO
- Auth NextAuth v5 (`src/lib/auth.ts`): Credentials + bcrypt + JWT, bloqueia `ativo:false`, não expõe `passwordHash`.
- RBAC: `Perfil`/`Permissao`/`PerfilPermissao`/`UsuarioPermissao` + `hasPermission` + `canAssignRole` (`src/lib/auth-helpers.ts`).
- Multi-tenant **parcial** em 6 modelos: `Liturgia`, `LiturgiaMusica`, `LiturgiaModelo`, `CanalOficial`, `Pregacao`, `VersiculoDiario` + join `UsuarioOrganizacao`.
- **Padrão correto de escopo** (é o blueprint a replicar): `canManageOrganization()` + `where: { organizacaoId: { in: vinculos } }`.
- CRUD admin completo + site público + `/api/health`.
- Testes: `__tests__/api/idor-organizacao.test.ts`, `rotas-protegidas.test.ts`, `lib/validations.test.ts`, `api/health.test.ts`.

### 3.2 INCOMPLETO
- Multi-tenant: só **6 de ~20 modelos** têm `organizacaoId`.
- `AuditLog` **sem** `organization_id`, `antes`/`depois`, `ip`, `user_agent` — e só é escrito em **3 rotas** de usuários.
- `GET /api/dashboard` (`src/app/api/dashboard/route.ts:12-26`): 5 contagens globais, **sem período, sem período anterior, sem variação, sem tendência, sem drill-down**.
- Sem seletor de contexto de igreja no admin; sem exportação; sem pendências/alertas; sem aprovações; sem conciliação.
- `User.perfilId` é **global** (não por igreja); `UsuarioOrganizacao` não tem `perfil_id` nem `ativo`.
- `Congregacao` **não existe como entidade** — é string solta em `Membro.congregacao` e `Liturgia.congregacao`.

### 3.3 QUEBRADO — vazamentos cross-tenant (9 itens) — **TODOS CORRIGIDOS na Fase 0 (sessão 2)**

| # | Arquivo:linha | Problema |
|---|---|---|
| 1 | `src/app/api/usuarios/route.ts:47-62` | `?organizacaoId=` **sem** `canManageOrganization` → enumera usuários de qualquer igreja |
| 2 | `src/app/api/usuarios/[id]/route.ts:87-193` | Sem bloqueio de **autoedição** (usuário concede `permissoes`/`role` a si mesmo) + não valida org do alvo |
| 3 | `src/app/api/usuarios/[id]/status/route.ts` | Desativa usuário de **outra** igreja |
| 4 | `src/app/api/comunicacao/pregacoes/route.ts` + `[id]/route.ts` | `liturgiaId` de outra org aceito → vínculo cross-tenant |
| 5 | `src/app/api/public/church-info/route.ts:8-12` | `findFirst({ ativo: true })` → **sempre a 1ª organização** (site público multi-tenant quebrado) |
| 6 | `src/app/api/public/eventos/route.ts` | Sem `organizacaoId` retorna eventos de **todas** as orgs |
| 7 | `api/membros`, `api/eventos`, `api/lideranca`, `api/avisos`, `api/dashboard` | Globais por construção — qualquer autenticado vê/edita tudo |
| 8 | `src/app/api/configuracoes/route.ts` (`PUT`) | Qualquer autenticado altera tema/nome **global** |
| 9 | `src/app/api/perfis/route.ts`, `src/app/api/permissoes/route.ts` | Sem `hasPermission('usuarios',…)` — viola a regra do próprio projeto |

### 3.4 DUPLICADO (risco de duas fontes de verdade)
- `/api/dashboard` já conta membros/líderes/eventos/avisos; `/api/comunicacao/dashboard` já conta pregações/canais → o novo painel **não pode** recalcular à parte.
- Seleção de `organizacaoId` replicada à mão em 3 telas de liturgia (`nova`, `modelos`, `musicas`).
- `src/data/site-data.ts` hardcoded duplica dados que deveriam vir de `ConfiguracoesIgreja`.
- Hierarquia de roles em `canAssignRole` diverge do `AGENTS.md` (LIDER/COORDENADOR).

### 3.5 RISCO
- **Cross-tenant por construção** em membros/eventos/financeiro/avisos/liderança — crítico para SaaS.
- **Sem RLS**: banco é Neon/Postgres via Prisma `driverAdapters`; hoje a defesa é **apenas app-layer**.
- JWT congela `organizacoes` no login (stale após troca de vínculo) — hoje não autoriza nada, mas é armadilha.
- `PUT` de membros/eventos/liderança/avisos **sem Zod**; `JSON.parse(error.message)` pode lançar dentro do `catch`.
- `details: error.message` do Zod vaza estrutura interna de validação.

### 3.6 REUTILIZÁVEL
- Padrão de escopo de liturgia/comunicação → blueprint das demais rotas.
- `AuditLog` → estender campos em vez de criar tabela nova.
- `Permissao(modulo:acao)` → acrescentar ações (`aprovar`, `exportar`, `ver_auditoria`, `gerenciar_igrejas`).
- `/api/dashboard` + `/api/comunicacao/dashboard` → **fundir** num único core de indicadores.
- `src/components/ui/` (Card, SectionHead, SearchBar, FormCard, FormGrid) + skills `api-route-pattern` e `design-system`.
- `__tests__/api/idor-organizacao.test.ts` → estender para membros/eventos/financeiro.

### 3.7 PRECISA CRIAR
- `organizacaoId`/`congregacaoId` em `Membro`, `Evento`, `Aviso`, `Lideranca`, `Ministerio`, `Departamento`, `Campanha`, `GaleriaAlbum`, `GaleriaItem`, `Oportunidade`, `Agenda`; `ConfiguracoesIgreja` por organização.
- Entidade `Congregacao`; `UsuarioOrganizacao.perfilId`/`ativo`; `AuditLog` estendido.
- `Inscricao` (status, `valorPrevisto`, `valorPago`, `checkIn`, `dataCheckIn`) — **NÃO EXISTE**.
- `Pagamento` (status, forma, `txidPix`, `estornadoDe`) — **NÃO EXISTE**.
- `Aprovacao` (entidade/tipo/solicitante/aprovador/status) — **NÃO EXISTE**.
- `/admin/gestao` (abas) + `/api/gestao/*`; filtro global de período; comparativo/consolidado; export; observações analíticas.

> Verificação: grep por `inscricao|pix|pagamento|checkin|aprovac|conciliac` em `*.ts,*.tsx,*.prisma,*.js`
> retornou **0 resultados** relevantes. Hoje só existe `EventoParticipante` (nome/email/telefone soltos,
> sem valor, sem status de pagamento, sem check-in).

---

## 4. Decisões técnicas do plano

- **Livro-razão financeiro ÚNICO**: estender `EventoFinanceiro` (adicionar `organizacaoId`, `congregacaoId?`,
  `categoria` = DIZIMO/OFERTA/DOACAO/INSCRICAO/DESPESA/OUTRO, `eventoId` opcional). **Não** criar tabela
  paralela de lançamentos — respeita "uma fonte de verdade" e evita duplicar indicadores.
- **`Congregacao` como entidade**, substituindo as strings `Membro.congregacao` e `Liturgia.congregacao`.
- **`ConfiguracoesIgreja` por organização** (a linha existente vira a config da organização padrão).
- **Migração de dados idempotente**: cria `Organizacao` padrão, popula `Congregacao` a partir das strings
  existentes, associa todos os registros existentes. **Nenhum dado é apagado / nenhum reset de banco.**

---

## 5. Plano de execução (5 fases)

### FASE 0 — Fundação multi-tenant (BLOQUEANTE) — **CONCLUÍDA em 03/10/2026 (sessão 2)**
- [x] Schema: `Congregacao`, `organizacaoId`/`congregacaoId?`, `EventoFinanceiro` estendido,
      `UsuarioOrganizacao.perfilId`/`ativo`, `Inscricao`/`Pagamento`/`Aprovacao`, `AuditLog` estendido.
- [x] Helpers `src/lib/tenant.ts` (`resolveOrgScope`, `assertOrgAccess`, `assertTargetUserScope`,
      `resolveTargetOrgId`, `resolveCongregacaoId`, `withOrgScope`, `orgFilter`).
- [x] Correção dos 9 vazamentos da seção 3.3.
- [x] Escopo por organização em membros, eventos, avisos, liderança, dashboard, usuários, configurações.
- [x] Migração de dados idempotente: `prisma/migrate-tenant.js` (**ainda não executada em produção**).
- [x] `npm test` (115) + `npx tsc --noEmit` + `npm run build`.

### FASE 1 — Auditoria completa — **CONCLUÍDA em 03/10/2026 (sessão 2)**
- [x] `src/lib/audit.ts` → `writeAudit(tx, { userId, organizacaoId, acao, entidade, entidadeId, antes, depois, req })`
      capturando IP + user-agent. **Nunca** grava senhas/secrets (sanitização por chave).
- [x] Eventos: `CREATE/UPDATE/DELETE/CONFIG_CHANGE/ACESSO_NEGADO` nas rotas de membros, eventos,
      liderança, avisos, configurações e usuários. (Faltam `LOGIN/LOGOUT/APPROVE/PAY/REFUND/
      PUBLISH/UNPUBLISH/CANCEL/PERMISSION_CHANGE/TROCA_CONTEXTO` — serão plugados nas Fases 2-3
      conforme os fluxos correspondentes existirem.)
- [x] `GET /api/gestao/auditoria` (filtro por org/período/usuário/ação/entidade).

### FASE 2 — Centro de Gestão — **BACKEND + UI PRINCIPAL CONCLUÍDOS (sessão 2)**
- [x] API (fonte única — `api/dashboard` e `api/comunicacao/dashboard` **delegam** ao core):
  - [x] `GET /api/gestao/indicadores?periodo=&dataInicio=&dataFim=&organizacaoId=&congregacaoId=&eventoId=&categoria=&status=`
  - [x] Por indicador: `{ valor, periodoAnterior, variacaoPercentual, media6Meses, formula, origem, unidade, filtrosAplicados }`
  - [ ] `GET /api/gestao/indicadores/[grupo]` → drill-down (pessoas/eventos/financeiro/conteúdo) até o registro.
- [x] Página `/admin/gestao` com abas: `VISÃO EXECUTIVA` · `INDICADORES` · `PENDÊNCIAS` ·
  `TOMADA DE DECISÃO` · `AUDITORIA` · `RELATÓRIOS` (as 3 últimas com placeholder das Fases 3/4).
- [x] Filtro global: período (Hoje, Ontem, 7d, 30d, Mês atual, Mês anterior, Trimestre, Semestre, Ano, Personalizado)
  + Organização. *(Faltam Congregação, Evento, Categoria, Status, Usuário.)*
- [x] Seletor de contexto de igreja no filtro (`/api/organizacoes` + "Todas as minhas"); estado é
  revalidado ao trocar (`carregar()` via `useCallback`).
- [ ] Consolidado = `TOTAL CONSOLIDADO` + **DETALHAMENTO POR IGREJA**; tabela comparativa por igreja/congregação
  **sem ranking**. Cada KPI com `ⓘ` (significado, fórmula, período, origem, filtros) — o `ⓘ` já existe;
  falta o consolidado/comparativo.

### FASE 3 — Pendências + Decisão
- `GET /api/gestao/pendencias`: URGENTE / ATENÇÃO / INFORMATIVO (pagamento pendente/parcial, evento próximo,
  sem publicação, aviso expirando, erro de pagamento, divergência financeira) — origem, data, responsável,
  prioridade, link.
- `GET /api/gestao/observacoes`: heurísticas determinísticas → `OBSERVAÇÃO` + `POSSÍVEL PADRÃO` +
  `DADOS QUE SUSTENTAM` + `PONTOS PARA INVESTIGAÇÃO`, sempre com período/fórmula/dados.
  **Sem decisão administrativa automática, sem inferir causa.**
- **Conciliação**: esperado × recebido × pendente × diferença, por igreja/evento.

### FASE 4 — Exportação, testes e docs
- `GET /api/gestao/relatorios/export?format=csv` (server-side, sem lib nova) + CSS `@media print`.
  Cabeçalho sempre: igreja, congregação, período, filtros.
- Testes (ver seção 6).
- Docs: `MULTI-TENANT.md`, `ACCESS-CONTROL.md`, `CHURCH-ISOLATION.md`, `AUDIT.md`, `INDICATORS.md`,
  `GENERAL-DASHBOARD.md`, `DECISION-MAKING.md`, `FINANCE.md`, `EVENTS.md` (+ este documento).
- Validação final: `npm test`, `npx tsc --noEmit`, `npm run build`, relatório final.

**Ordem:** Fase 0 → 1 → 2 → 3 → 4, com `npm test` e `npx tsc --noEmit` ao fim de cada fase.

---

## 6. Matriz de testes

| Arquivo | Cobertura | Status |
|---|---|---|
| `__tests__/lib/tenant.test.ts` | `resolveOrgScope`, `assertOrgAccess`, `withOrgScope` | **feito** |
| `__tests__/api/isolamento-membros.test.ts` | IDOR membros | **feito** |
| `__tests__/api/isolamento-eventos.test.ts` | IDOR eventos | **feito** |
| `__tests__/api/usuarios-escopo.test.ts` | vazamento do `?organizacaoId=` + autoedição | **feito** |
| `__tests__/api/public-isolamento.test.ts` | `church-info` / `public/eventos` multi-tenant | **feito** |
| `__tests__/api/isolamento-financeiro.test.ts` | IDOR financeiro | pendente (Fase 2) |
| `__tests__/api/gestao-indicadores.test.ts` | filtros, períodos, variação, escopo | **feito** |
| `__tests__/lib/indicadores.test.ts` | fórmulas (taxa de pagamento, comparecimento, saldo) | **feito** |
| `__tests__/api/auditoria.test.ts` | escrita de auditoria + acesso negado | **feito** |

Cenários obrigatórios: USER_A→A (ok) · USER_A→B (403) · USER_B→A (403) · PRESIDENTE→A/B/todas ·
ADMIN_GERAL→todas · manipulação de `organizacaoId`/`eventoId`/`inscricaoId`/`financeiroId` no body/query.

---

## 7. Referências rápidas

- Schema atual: `prisma/schema.prisma` (591 linhas)
- Auth/RBAC: `src/lib/auth.ts`, `src/lib/auth-helpers.ts`, `src/middleware.ts`
- Regras do projeto: `AGENTS.md`, `.claude/rules/seguranca.md`, `.claude/rules/backend/README.md`
- Padrão de rota a replicar: `src/app/api/liturgia/route.ts`, `src/app/api/comunicacao/canais/route.ts`
- Produção: `https://admp-ma.vercel.app`
