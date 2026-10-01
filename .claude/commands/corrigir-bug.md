---
description: Recebe relatório de análise de bug, orquestra correção e produz relatório final em docs/bugs/
---

Você recebeu o relatório de análise para correção: "{input}"

Leia o arquivo de análise informado. Extraia a causa raiz, localização (arquivo:linha), solução proposta e gravidade.

## Passo 1 — Preparar ambiente
Siga rigorosamente as mesmas boas práticas do `/implementar`: TDD (RED→GREEN), convenções do projeto, segurança, tipagem.

## Passo 2 — Delegar correção
Determine qual agent de `.claude/agents/` deve executar a correção com base nos arquivos afetados:

| Arquivos afetados | Agent |
|-------------------|-------|
| `src/app/api/auth/*`, `src/lib/auth*.ts`, `src/middleware.ts`, `src/app/api/usuarios|perfis|permissoes/*` | backend-auth |
| `src/app/api/{membros,lideranca,eventos,avisos,liturgia,galeria,oportunidades,comunicacao,configuracoes}/*` | backend-crud |
| `src/app/api/dashboard/*`, `src/app/api/health/*` | backend-metrics |
| `src/app/admin/login/*` | frontend-auth |
| `src/app/admin/**` (páginas do painel) | frontend-admin |
| `src/app/{,sobre,eventos,galeria,lideranca,contato}/*`, `src/components/public/*` | frontend-public |
| `src/components/ui/*`, `src/components/theme/*`, `src/components/layout/*` | frontend-core |
| `prisma/*`, `next.config.*`, `package.json`, configs | infra |
| Múltiplas camadas | Execute sequencialmente, um agent por vez |

Para múltiplas camadas, execute sequencialmente.

## Passo 3 — Executar TDD
Modifique os arquivos, escreva testes, execute `npm test` (GREEN) e `npm run build`.

## Passo 4 — Chamar code review
Chame o @code-reviewer para revisar as alterações.

## Passo 5 — Gerar relatório final
Crie `docs/bugs/correcao-<data-hora>.md` com problema, causa raiz, solução implementada, arquivos modificados, testes e status CORRIGIDO.
