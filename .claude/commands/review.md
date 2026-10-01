---
description: Revisa o código contra AGENTS.md e docs/, classifica em BLOQUEANTE, IMPORTANTE, SUGESTÃO
---

Chame o @code-reviewer com as seguintes instruções:

Leia `AGENTS.md` e, se existirem, os documentos de referência em `docs/` (planos em `docs/planos/`, identidade visual, auditorias).

Analise todo o código-fonte implementado em `src/`, `prisma/`, `__tests__/` e arquivos de configuração na raiz.

Compare o que foi implementado contra o que está especificado. Verifique:

1. Se os endpoints de API necessários existem e funcionam (módulos de `AGENTS.md`)
2. Se os testes cobrem os cenários críticos (login, RBAC, CRUD, rotas públicas)
3. Se as convenções do projeto (AGENTS.md, `.claude/rules/`) foram seguidas
4. Se há violações de segurança (role/id vindo do body, `passwordHash` exposto, falta de `requireAuth()`, dados de outras organizações vazando)
5. Se a estilização usa variáveis CSS do tema (sem cores hardcoded, sem Tailwind)
6. Execute `npm test` e veja se passa
7. Execute `npm run build` e veja se compila

Produza a saída no formato:
## 🔴 BLOQUEANTE
## 🟡 IMPORTANTE
## 🟢 SUGESTÃO
