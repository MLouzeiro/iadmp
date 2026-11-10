# Plano de Clonagem — IADMP Project → `iadmp-portal-v2`

> Fase 1 (auditoria read-only). **Nada aqui será executado sem aprovação explícita.** Objetivo: criar a nova versão sem tocar em produção (`https://iadmp-ma.vercel.app`, projeto Vercel `iadmp-ma`).

---

## 1. Princípios de segurança (regras absolutas)

1. **Não alterar produção.** Nenhum deploy, DNS ou credencial do projeto antigo.
2. **Não reutilizar o banco de produção** para testes.
3. **Proibido** DROP/TRUNCATE/RESET, migrations destrutivas e edição manual de SQL.
4. Se qualquer passo apresentar risco, **parar e pedir autorização**.
5. Trabalhar em repositório/projeto **novo** e isolado.

---

## 2. Decisões a confirmar antes de começar

| Item | Proposta | Precisa confirmar? |
|---|---|---|
| Nome do repositório | `iadmp-portal-v2` | ✅ Sim |
| Nome do projeto Vercel | `iadmp-portal-v2` (`iadmp-portal-v2.vercel.app`) | ✅ Sim |
| Domínio final | `iadmpma.com` (ainda não registrado) | ✅ Sim |
| Banco de dados | **Novo branch/projeto Neon** (nunca o de produção) | ✅ Sim |
| Storage | **Novo bucket Supabase** (ou prefixo isolado) | ✅ Sim |
| GitHub | novo repo em `MLouzeiro` ou organização? | ✅ Sim |

> Enquanto não houver confirmação, a Fase 2 fica bloqueada.

---

## 3. Estratégia de clonagem (recomendada)

### Opção A — Fork limpo (recomendada)
1. Criar repositório novo `iadmp-portal-v2`.
2. Copiar o código atual **sem** `.git`, `.env*`, `node_modules`, `.next`.
3. Primeiro commit como "baseline v1".
4. Evoluir a v2 em branches por feature.

**Vantagens:** histórico limpo, produção intocada, fácil rollback.

### Opção B — Branch de trabalho no mesmo repositório
- Criar branch `v2` a partir de `feat/novo-layout-home`.
- **Desvantagem:** risco de confusão com produção e histórico misturado. Só usar se o usuário preferir.

> **Recomendação: Opção A.**

---

## 4. Pré-requisitos técnicos (antes da v2)

Corrigir na cópia da v2, nunca em produção:

1. **16 erros de TypeScript** (ver `AUDITORIA_PROJETO_ATUAL.md`), priorizando `src/app/admin/publicacoes/page.tsx` e `src/app/api/publicacoes/[id]/route.ts`.
2. **Prisma/adapter:** alinhar versões; ativar adapter corretamente ou remover `@prisma/adapter-neon`/`@neondatabase/serverless`.
3. **Slug da home:** substituir `const slugPortal = 'iadmp-sede'` por resolução via banco/config.
4. **`next.config.js`:** restringir `images.remotePatterns`; planejar remoção de `typescript.ignoreBuildErrors`.
5. **Middleware:** reforçar verificação além do cookie.

---

## 5. Banco de dados isolado

1. Criar **novo projeto/branch Neon** para a v2.
2. Definir `DATABASE_URL` própria (nunca a de produção).
3. Rodar `npx prisma generate`.
4. Aplicar schema na base nova: `npm run db:push`.
5. Popular: `npm run db:seed`.
6. **Validar o slug:** garantir que a organização criada corresponda ao slug usado pelo site (hoje há divergência `iadmp-central` vs `iadmp-sede`).
7. Se houver dados reais a migrar: exportar/importar de forma **read-only** a partir de produção, com autorização e sem escrita na origem.

> Regra: `db:reset` **nunca** contra produção. Ele é destrutivo.

---

## 6. Storage isolado

1. Criar bucket novo no Supabase (ou usar prefixo por organização).
2. Configurar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_BUCKET`.
3. **Nunca** usar a `service_role` no frontend.
4. Revalidar limites de 5 MB e MIME.

---

## 7. Variáveis de ambiente da v2

Criar `.env.example` (sem segredos) e `.env.local` (não versionado):

```
DATABASE_URL=            # novo Neon
NEXTAUTH_URL=            # URL da v2 (preview/dev)
NEXTAUTH_SECRET=         # novo segredo
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_BUCKET=imagens
```

> **Não copiar** segredos de produção.

---

## 8. Deploy da v2

1. Criar projeto Vercel **separado** (`iadmp-portal-v2`).
2. Apontar para o repositório novo.
3. Configurar env vars do projeto novo.
4. Deploy **preview** primeiro; validar.
5. **Não** alterar o projeto `iadmp-ma`.
6. Só após validação e autorização, associar `iadmpma.com` à v2.

---

## 9. Sequência de fases da v2 (visão macro)

| Fase | Entrega |
|---|---|
| 1 | Auditoria (este pacote de docs) |
| 2 | Clonagem isolada (repo + Neon + Supabase + Vercel preview) |
| 3 | Correção de tipos/Prisma/config |
| 4 | Fundação multi-tenant e RBAC revisados |
| 5 | Editor de blocos (`PaginaPublica`) |
| 6 | Fluxo editorial/publicação/aprovação |
| 7 | Portal geral + páginas por congregação |
| 8 | Painel central/local |
| 9 | Auditoria e observabilidade |
| 10 | Financeiro (escopo a definir) |
| 11 | Testes e cobertura |
| 12 | Performance e Storage |
| 13 | SEO/SSR do site público |
| 14 | Hardening de segurança |
| 15 | Deploy final e migração de domínio |

> A ordem detalhada será reemitida no prompt mestre de cada fase.

---

## 10. Checklist de aceite da clonagem

- [ ] Repositório novo criado (sem segredos/histórico de produção)
- [ ] `npm install` e `npx prisma generate` ok
- [ ] `npx tsc --noEmit` sem erros (após correções)
- [ ] `npx jest` 100% verde
- [ ] `npm run build` ok
- [ ] Banco novo com seed aplicado
- [ ] Storage novo configurado
- [ ] Deploy preview acessível
- [ ] Produção antiga **intocada** (verificar projeto Vercel `iadmp-ma`)
- [ ] Home pública resolve organização correta (sem slug hardcoded)

---

## 11. Rollback

- A v2 é um ambiente **separado**; rollback = simplesmente não promover o deploy.
- Produção antiga permanece online até a virada de domínio ser autorizada.
- Manter tag/branch `baseline-v1` no repositório novo.

---

## 12. O que NÃO fazer

- ❌ Deploy da v2 no projeto Vercel `iadmp-ma`.
- ❌ Apontar `DATABASE_URL` da v2 para o Neon de produção.
- ❌ Rodar `db:reset`/`db:push --force-reset` em qualquer base com dados reais.
- ❌ Copiar `.env` de produção para a v2.
- ❌ Alterar DNS antes da validação.
- ❌ Editar migrations SQL à mão.

---

## 13. Progresso das Fases 2 e 3

| Passo | Status | Detalhe |
|---|---|---|
| Decisões da seção 2 | ✅ Confirmadas | Branch `feat/portal-v2` no repo `MLouzeiro/iadmp` (sem fork), Neon branch isolado, previews no projeto Vercel `iadmp-ma` |
| Banco isolado | ✅ Criado e verificado | Projeto Neon `igreja-prod` (`mute-mountain-85557897`), branch **`v2-dev`** (`br-proud-salad-ah91vh1a`), endpoint `ep-dry-morning-ahwtg7a2`, a partir de `production`. Dados copiados: 5 usuários, 10 eventos, 1 publicação, 3 páginas públicas, 3 arquivos, 63 logs. Produção intacta (endpoint `ep-dark-math-ahrjmyg9`, suspensa). |
| Credencial da v2 | ✅ Local | `DATABASE_URL` do branch `v2-dev` gravada em `.env.local` (não versionado); `.env` de produção permanece separado. |
| Branch de trabalho | ✅ Criada | `feat/portal-v2` (base `feat/novo-layout-home` / `916a1fd`). `master`/produção intactos. |
| Env de Preview | ✅ Criadas | `DATABASE_URL` (Secret, v2-dev), `NEXTAUTH_SECRET` (Secret, novo) e 3 `NEXT_PUBLIC_SUPABASE_*` (Config), todas escopo **Preview** no projeto `iadmp-ma`. Produção não alterada. |
| Stack alinhada | ✅ Concluído | Removidos `@prisma/adapter-neon`/`@neondatabase/serverless` (não usados) e `previewFeatures = ["driverAdapters"]`; `typescript.ignoreBuildErrors: false`; removido bloco `images` do `next.config.js`; `.vercelignore` para não subir segredos. |
| Verificação local | ✅ | `npx tsc --noEmit` sem erros; Jest **28 suítes / 387 testes** passando; `npm run build` OK (Next 16.3.3 Turbopack, 74 páginas). |
| Preview Vercel | ✅ Publicado e validado | https://iadmp-j10fk0h9c-louzeiro.vercel.app — `/api/health` conectado, `/api/public/congregacoes` retorna 3 orgs, home/login renderizam, leitura confirmada em `v2-dev`. |
| Proteção do preview | ⏳ Pendente | Deployment Protection (SSO) ativa; acesso no browser exige bypass/share link (ou desativar proteção de Preview). |
| Storage v2 | ⏳ Pendente | Reutilizar bucket com prefixo isolado. |
| Commit/push da fase | ⏳ Pendente | Working tree não commitado; aguardando autorização explícita. |

> **Status:** Fase 1 concluída. Fase 2 concluída (banco, branch, env de Preview). Fase 3 concluída e validada em preview: tipos, testes e build OK, deploy de Preview no ar lendo o banco isolado. `/api/public/eventos` vazio é esperado (nenhum evento publicado e futuro). Próximo: liberar acesso ao preview e iniciar a fase seguinte.
