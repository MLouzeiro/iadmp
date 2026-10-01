---
description: Verifica pendências do projeto (AGENTS.md, docs/planos/), gera relatório de próximos passos e confirma readiness
---

Execute a rotina de encerramento de projeto:

## Passo 1 - Verificar hooks de encerramento
Se existirem hooks em `.claude/hooks/`, verifique se todos executam sem erros.

## Passo 2 - Verificar planos e pendências
Se existirem planos em `docs/planos/`, verifique o status de cada checkbox `[ ]` / `[x]` das tasks: !`Get-ChildItem docs/planos -Filter *.md 2>&1`
Leia as **Decisões em aberto** e os **testes críticos** de `@AGENTS.md` e contabilize concluídos vs. pendentes.

## Passo 3 - Validar integridade do projeto
- `!npm test -- --silent 2>&1` deve passar sem falhas
- `!npm run build 2>&1` deve compilar sem erros
- `!npx prisma validate 2>&1` deve passar
- Verifique se `.env.example` está atualizado (mesmas chaves do `.env`): !`Compare-Object (Select-String -Path .env.example | ForEach-Object { $_ -replace '=.*', '' }) (Select-String -Path .env | ForEach-Object { $_ -replace '=.*', '' }) 2>&1`
- Verifique se `@AGENTS.md` reflete a estrutura real de pastas: !`Get-ChildItem -Recurse -Directory src/app/api src/components src/lib prisma __tests__ | Select-Object -ExpandProperty FullName 2>&1`

## Passo 4 - Gerar relatório de próximos passos
Produza um relatório markdown com:

```
# Relatório de Entrega

## Resumo
- Módulos concluídos: X de 6 (M1 Auth, M2 CRUD, M3 Métricas, público, core, infra)
- Testes passando: !npm test
- Decisões em aberto: X

## Status por módulo
### M1 — Autenticação & RBAC
- [x] ...
- [ ] ...

### M2 — CRUD dos módulos
...

## Status do Deploy
- [ ] Vercel configurado (NEXTAUTH_URL, NEXTAUTH_SECRET, DATABASE_URL)
- [ ] Banco Neon conectado
- [ ] Seed executado (npm run db:seed)

## Próximos Passos
1. [descrição da próxima pendência]
2. ...
```

## Passo 5 - Confirmar readiness
Se os seguintes itens estiverem OK, declare o projeto **pronto para ser clonado por outra pessoa**:
- [ ] `npm install && cp .env.example .env && npm run db:push && npm run db:seed && npm run dev` funciona do zero
- [ ] `npm test` passa
- [ ] `npm run build` compila
- [ ] `npx prisma validate` passa
- [ ] `AGENTS.md` está atualizado
- [ ] Não há secrets vazados no repositório: !`git log --all --diff-filter=A --follow -p -- '.env' 2>&1 | Select-String -Pattern 'NEXTAUTH_SECRET|DATABASE_URL' -SimpleMatch`
