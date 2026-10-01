---
description: Revisa o código contra AGENTS.md e docs/, classifica em BLOQUEANTE, IMPORTANTE, SUGESTÃO
agent: code-reviewer
---

Leia os documentos de referência:
- @AGENTS.md
- docs/ (planos em `docs/planos/` quando existirem, `docs/IDENTIDADE_VISUAL.md`)

Analise todo o código-fonte implementado em `src/`, `prisma/`, `__tests__/` e arquivos de configuração na raiz.

Compare o que foi implementado contra o que está especificado. Verifique:

1. Se todos os endpoints de API necessários existem e funcionam (módulos de AGENTS.md)
2. Se os testes cobrem os cenários críticos (login, RBAC, CRUD, rotas públicas)
3. Se as convenções do projeto foram seguidas (@AGENTS.md, `.claude/rules/`)
4. Se há violações de segurança (role/id vindo do body, `passwordHash` exposto, falta de `requireAuth()`, dados de outras organizações vazando)
5. Se a estilização usa variáveis CSS do tema (sem cores hardcoded, sem Tailwind)
6. Se `npm test` passa sem falhas: !`npm test -- --silent 2>&1`
7. Se `npm run build` compila sem erros: !`npm run build 2>&1`
8. Se não há secrets vazados no repositório: !`git log --all --diff-filter=A --follow -p -- '.env' 2>&1 | head -20`

Produza a saída no formato:
## 🔴 BLOQUEANTE
- [arquivo:linha] descrição do problema

## 🟡 IMPORTANTE
- [arquivo:linha] descrição do problema

## 🟢 SUGESTÃO
- [arquivo:linha] descrição da melhoria

Regras:
- BLOQUEANTE = funcionalidade quebrada, segurança comprometida, convenção violada de segurança, build/test falhando
- IMPORTANTE = convenção violada, falta de teste, validação insuficiente
- SUGESTÃO = melhoria de legibilidade, boas práticas sem impacto funcional
- Se encontrar o mesmo padrão em múltiplos arquivos, aponte uma vez e generalize
- Se `npm test` ou `npm run build` falharem, isso é BLOQUEANTE
