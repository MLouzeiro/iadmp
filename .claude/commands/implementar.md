---
description: Implementa uma task (ID ou descrição), executa TDD e dispara o code-reviewer ao final
---

Você recebeu a task "{input}".

## Passo 1 — Localizar a task
Se o input for um **ID de task** (ex: "Task 1.2"), procure o plano correspondente em `docs/planos/` e localize a task.
Se for uma **descrição livre**, trate a descrição como a task.
Identifique:
- O **agent** correto dos disponíveis em `.claude/agents/` (backend-auth, backend-crud, backend-metrics, frontend-auth, frontend-admin, frontend-public, frontend-core, infra)
- As **dependências** (backend antes de frontend da mesma funcionalidade)
- O **output esperado** (arquivos a criar/modificar)
- Os **testes críticos** que precisam passar

## Passo 2 — Validar dependências
Verifique se as tasks das quais esta depende já foram concluídas (checklists em `docs/planos/`) e se os arquivos de output esperados existem. Se alguma dependência estiver faltando, avise o usuário e pare.

## Passo 3 — Implementar com TDD
1. Primeiro, escreva os **testes** correspondentes à task (em `__tests__/`)
2. Execute `npm test` — eles devem falhar (RED)
3. Implemente o código necessário usando o agent correto de `.claude/agents/`, seguindo `AGENTS.md` e `.claude/rules/`
4. Execute `npm test` novamente — devem passar (GREEN)
5. Execute `npm run build` para verificar compilação

## Passo 4 — Rodar testes completos
Execute `npm test` completo para garantir que nada quebrou.

## Passo 5 — Code Review automático
Chame o @code-reviewer para revisar especificamente esta task e seu impacto no resto do sistema.

## Passo 6 — Gerar documentação
Crie dois relatórios com a data atual no nome (ex: `feature-2026-09-25.md`):

1. **Relatório técnico** → `docs/tecnico/feature-<data>.md`
   - Descreva tecnicamente o que foi implementado: arquivos criados/modificados, endpoints, modelos de dados, lógica de negócio, decisões técnicas
   - Inclua diagrama ASCII ou textual do fluxo se aplicável
   - Liste as dependências e pacotes envolvidos

2. **Relatório de uso** → `docs/uso/feature-<data>.md`
   - Documentação orientada ao usuário leigo (pastor, líder, secretária)
   - Explique como usar a funcionalidade em passos simples
   - Inclua descrição dos campos, botões e telas
   - Use linguagem não-técnica ("clique em Novo Membro" em vez de "POST /api/membros")

Crie os diretórios se não existirem.
