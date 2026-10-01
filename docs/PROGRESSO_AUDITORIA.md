# PROGRESSO DA AUDITORIA SÊNIOR — IADMPMA

> **Data:** 30/09/2026 (sessão 1) · **Status:** auditoria inicial concluída, correções pendentes
> **Produção oficial definida pelo responsável:** `https://admp-ma.vercel.app`
> Este documento existe para retomar o trabalho na próxima sessão. **Não apagar.**

---

## 1. O que foi feito nesta sessão (READ-ONLY)

| Ação | Resultado |
|---|---|
| Auditoria completa de código (backend/segurança/UI) | ✅ 50+ achados, ver seção 4 |
| `npx tsc --noEmit` | ✅ 0 erros |
| `npm test` | ✅ 5 suítes, **65/65 testes** |
| `npm run build` | ✅ build ok, 41 rotas |
| `npm run lint` | 🔴 135 problemas (85 erros) — pré-existente |
| Inspeção dos projetos Vercel + logs | ✅ causa raiz encontrada |
| Consultas SQL somente-SELECT no banco | ✅ nenhum dado alterado |

**Nenhum arquivo do projeto foi alterado nesta sessão até o momento do commit descrito na seção 6.**

⚠️ Efeito colateral: uma consulta de leitura acordou o compute Neon e tirou a branch
`production` do estado `archived` (01/10 02:22 UTC). Nenhum dado foi modificado.

---

## 2. Causa raiz — produção fora do ar (RESOLVIDO O DIAGNÓSTICO)

**Sintoma:** `GET /api/health` retorna 500 em `https://admp-ma.vercel.app`:

```
PrismaClientInitializationError: Can't reach database server at
`ep-dark-math-ahrjmyg9-pooler.c-3.us-east-1.aws.neon.tech:5432`
```

**Fatos apurados:**

1. O projeto Vercel `admp-ma` (prj_OjKmaSkNtA3IvaX51gz44ZYO2Ioh) tem
   **ZERO variáveis de ambiente salvas** (`vercel env ls` → "No Environment Variables found",
   `vercel env pull` → só variáveis de sistema). Portanto `DATABASE_URL`, `NEXTAUTH_SECRET`
   e `NEXTAUTH_URL` **não estão configurados**.
2. O valor usado em produção veio **embutido no build de 12 dias atrás** (deploy via CLI
   a partir desta máquina, com o `.env` local da época).
3. O banco **está saudável**: conexão local funciona (`SELECT` retorna os 3 usuários),
   compute ativo, TCP 5432 acessível.
4. **Teste decisivo:** mantive uma conexão local aquecida por 45s (a cada 1,5s) enquanto
   chamava `/api/health` 5 vezes — local OK nas 16 chamadas, Vercel **falhou nas 5**.
   → **não é cold start nem suspensão do compute.**
5. **Teste reprodução:** removi `?sslmode=require` do `DATABASE_URL` local e obtive
   **exatamente** a mesma mensagem de erro da produção. Com `sslmode=require` → OK;
   com `sslmode=disable` → falha; host sem `-pooler` + `sslmode=require` → OK.

**Conclusão:** o `DATABASE_URL` embutido no build de produção **está sem `sslmode=require`**
(a Neon exige TLS). Não há bloqueio de rede.

**Correção (ainda NÃO aplicada — pendente para a próxima sessão):**

```powershell
# executar na raiz do projeto (C:\Users\Louzeiro\Documents\Louzeiro\Projeto\iadmpma)
# 1) salvar as 3 variáveis no projeto Vercel "admp-ma" (Production)
npx vercel env add DATABASE_URL production   # colar o valor de .env (com ?sslmode=require)
npx vercel env add NEXTAUTH_SECRET production
npx vercel env add NEXTAUTH_URL production   # https://admp-ma.vercel.app

# 2) rebuild obrigatório (o valor é embutido no build)
npx vercel --prod

# 3) validar
#    https://admp-ma.vercel.app/api/health  ->  {"status":"ok", ...}
```

### Outro projeto encontrado (não é mais o alvo)
`admpma.vercel.app` (projeto Vercel `admpma`, 31d) **tem** as 3 env vars, mas o
`DATABASE_URL` está **malformado** (erro: "the URL must start with the protocol
postgresql://") — provavelmente aspas/espaço no valor. Criado como *Secret*, então o valor
não pode ser lido via CLI. **Decisão do responsável: a produção é `admp-ma`.**

---

## 3. Mapa do ambiente (confirmado nesta sessão)

```
Código        → GitHub  https://github.com/MLouzeiro/iadmp.git  (branch master)
Local         → 1 commit à frente de origin/master + 25 modificados + ~35 não rastreados
Deploy        → Vercel, projeto "admp-ma" (marcios-projects-d73091a0), deploy manual via CLI
                (sem integração Git — push NÃO dispara deploy automático)
Produção      → https://admp-ma.vercel.app          ← definida pelo responsável
Banco         → Neon "igreja-prod" (mute-mountain-85557897), Postgres 17, aws-us-east-1
                branch production → ep-dark-math-ahrjmyg9-pooler (sslmode=require OBRIGATÓRIO)
Dev usa MESMO banco de produção  →  npm run db:push altera produção
Migrations    → NÃO EXISTE prisma/migrations (só db push)  → risco de schema não versionado
```

**Outros projetos Vercel do mesmo time (não usar):** `admpma`, `iadmpma` (app Vite),
`iadmp` (CRA legado), `ministerio-promessa` (Vite), `iadmp-louvor` (sistema separado).

**Estado do banco (dados reais — NÃO APAGAR):** 3 usuários · 1 organização · 14 lideranças ·
8 eventos · 3 liturgias · 6 músicas · 1 aviso · 1 config · 2 audit logs · 0 membros.

**Aderência schema × banco:** o banco **já tem** `LiturgiaMusica`, `LiturgiaModelo`,
`Organizacao`, `Perfil`, `Permissao`, `UsuarioPermissao`, `AuditLog` (db push já rodou em
produção). **Não tem** `Pregacao`, `CanalOficial`, `VersiculoDiario`, `VersiculoHistorico`
(estão no schema local). → **não rodar `npm run db:push` sem antes gerar migration + backup.**

---

## 4. Pendências de correção (prioridade)

### 🔴 CRÍTICO — segurança
1. `src/app/api/usuarios/route.ts:47-62` — `?organizacaoId=` pula o filtro multi-org (IDOR).
2. `src/app/api/usuarios/[id]/route.ts:87-177` — PUT sem escopo/hierarquia → troca senha
   e role de qualquer usuário, inclusive SUPER_ADMIN (takeover).
3. `src/app/api/usuarios/route.ts:154-177` — `perfilId`/`permissoes` livres no POST.
4. `src/app/api/usuarios/[id]/status/route.ts:5-55` — sem escopo de organização.
5. DELETE sem `hasPermission`: `membros/[id]:59-67`, `lideranca/[id]:58-66`,
   `eventos/[id]:63-71` (hard delete de PII).
6. `src/middleware.ts:5-17` — checa só a **presença** do cookie; nenhuma das 29 páginas do
   admin tem guarda no cliente → qualquer `MEMBER` navega o painel.
7. `PUT /api/configuracoes` sem RBAC e sem Zod (`configuracoes/route.ts:24-56`).
8. GETs sensíveis só com `requireAuth` (PII de membros, `evento.financeiro`, `perfis`,
   `permissoes`).

### 🟠 ALTO
9. Zod ausente em 15+ POST/PUT (`avisoSchema`, `liturgiaSchema`, `financeiroSchema`
   existem e não são usados).
10. Role/orgs do JWT só gravados no login → estado obsoleto (`src/lib/auth.ts:52-67`).
11. FKs cross-org em liturgia/pragações (`musicaId`, `modeloId`, `liturgiaId`).
12. `/api/seed` com senha `admin123` hardcoded (também em 4 docs) + mutação via GET.
13. `/api/health` devolve `error.message` cru (expõe host do banco) a anônimos.
14. `next.config.js:10` → `typescript.ignoreBuildErrors: true`.

### 🟡 MÉDIO — UI/Tema
15. Tema **claro** anulado pelo `ThemeProvider.tsx:83-103` (sobrescreve os 23 tokens de
    `globals.css:38-60`) → `light` renderiza escuro; contraste **1,05:1** em
    `--bg-secondary #F5E6C8` + `--text-primary #F0ECE2` → títulos de /sobre, /eventos,
    /galeria, /lideranca, /contato invisíveis.
16. Escolha de tema do Navbar perdida no reload (ThemeProvider não lê `localStorage`).
17. `useTheme`/`ThemeContext`/`colorsToCssVariables` são código morto; gradiente
    `--gradient-gold` plano (`ThemeProvider.tsx:98`).
18. 26 de 29 páginas do admin engolem o erro da API (sem feedback).
19. Validação client-side por `if + alert`; botões sem `aria-label`
   (`canais/page.tsx:191,194,197`); grids fixos sem breakpoint
   (padrão correto já existe em `canais/page.tsx:181`).
20. Lint: 85 erros (ex.: `any` em `src/lib/auth.ts:54-64`).

### 🟢 O QUE ESTÁ BOM (não mexer)
`passwordHash` nunca vaza · nenhum log de segredo/header · escopo multi-org **consistente**
em liturgia/músicas/modelos/canais/pragações/versículos · suíte de testes IDOR dedicada ·
`/api/health` só expõe SET/NOT SET · trava de produção no `/api/seed` · bloqueio de
`javascript:`/`data:` em URLs · soft delete em músicas/modelos · erro padronizado `{ error }`.

---

## 5. Matriz de riscos de produção

| Risco | Status |
|---|---|
| Produção sem banco (login/painel fora) | 🔴 diagnosticado, correção pendente |
| 5+ URLs/projetos Vercel concorrentes | 🟠 `admp-ma` definida como oficial |
| ~60 arquivos nunca commitados | 🔴 **corrigido nesta sessão** (seção 6) |
| Schema alterado sem migration | 🔴 pendente (fase 4) |
| Escalação de privilégio / takeover | 🔴 pendente |
| Sem rollback de deploy | 🟠 pendente |
| Produção e dev compartilham o mesmo banco | 🟠 pendente |
| Credencial `admin123` documentada | 🟡 pendente |

---

## 6. O que foi commitado nesta sessão ✅ CONCLUÍDO

- **Commit `9757b71`** — `feat: add usuarios/comunicacao/liturgia modules, tests and audit docs`
  (156 arquivos: módulos de comunicação, liturgia, usuários, perfis/permissoes/organizações,
  rotas públicas, `auth-helpers.ts`, suíte Jest, ESLint, tooling `.claude/`/`.opencode/`/
  `AGENTS.md`, e este documento).
- **Validação antes do commit:** `tsc` 0 erros · `jest` 65/65 · `next build` ok.
  Nenhum arquivo sensível stagingado (`.env`, `node_modules`, `rag.db`, `.next`, `.vercel` fora).
- **Push realizado:** `e16eb70..9757b71 master -> master` → `origin/master` sincronizado
  (0 commits de diferença, working tree limpa).
- Deploy NÃO é automático (a Vercel não tem integração Git neste projeto) → **produção
  continua no código antigo até a Fase 0 da seção 7.**

---

## 7. PLANO DA PRÓXIMA SESSÃO (amanhã)

**Fase 0 — produção de volta no ar (estimativa: 15 min)**
1. `npx vercel env add DATABASE_URL|NEXTAUTH_SECRET|NEXTAUTH_URL production` no projeto `admp-ma`
   (valores do `.env` local; `DATABASE_URL` precisa de `?sslmode=require`).
2. `npx vercel --prod` (rebuild obrigatório).
3. Validar `/api/health` → 200, login no painel, home com eventos/versículos.
4. *(Opcional)* decidir o destino dos projetos Vercel antigos: `admpma`, `iadmpma`,
   `iadmp`, `ministerio-promessa` — **pergunta ao responsável antes de apagar qualquer coisa.**

**Fase 1 — salvar o trabalho (15 min)** — commit + push ✅ feito na sessão 1.

**Fase 2 — críticos de segurança (2–3 h)** — itens 1 a 8 da seção 4, **com testes**
(401/403/200 por endpoint, replicando `__tests__/api/idor-organizacao.test.ts`).
> Obs.: os testes atuais mockam `hasPermission` como `true` → nenhum teste de 403 real.

**Fase 3 — guarda do `/admin` + feedback de erro nas 29 telas (1–2 h)**

**Fase 4 — banco (1 h, EXIGE autorização explícita)**
- Backup/branch snapshot → `prisma migrate diff` para gerar a migration inicial a partir do
  estado real do banco → commitar `prisma/migrations` → parar de usar `db push` em produção.

**Fase 5 — Zod + `hasPermission` em todas as rotas (2–3 h)**

**Fase 6 — tema/Dark Mode/contraste/responsividade (2–3 h)** — unificar `ThemeProvider`
com `globals.css:38-60` + `colorsToCssVariables()`; corrigir contraste; persistir tema.

**Fase 7 — lint + docs + fluxo preview→produção (1–2 h)**

---

## 8. Comandos úteis

```powershell
# raiz: C:\Users\Louzeiro\Documents\Louzeiro\Projeto\iadmpma
npm run dev            # desenvolvimento (porta 3000)
npm test               # 65 testes
npx tsc --noEmit       # checagem de tipos real
npm run lint           # 85 erros pendentes
npm run build          # build de produção

npx vercel env ls      # env vars do projeto linkado (admp-ma)
npx vercel logs https://admp-ma.vercel.app    # logs da produção
npx vercel inspect https://admp-ma.vercel.app # deployment atual
```

**Antes de qualquer alteração de banco:** `INSPECIONAR → ENTENDER → MEDIR → PLANEJAR →
TESTAR → ALTERAR → VALIDAR → DEPLOY → MONITORAR`. Nada de `DROP`/`TRUNCATE`/`DELETE` sem
autorização explícita.
