# Convenções Gerais (valem para qualquer agente)

## Formato de resposta
- Erros: `{ error: "mensagem descritiva em português" }` via `NextResponse.json(..., { status })`
- Sucesso: JSON direto sem wrapper — objeto `{ id, nome, ... }` ou array `[{...}]`
- Status codes: 400 (dados inválidos), 401 (não autenticado), 403 (acesso negado), 404 (não encontrado), 500 (erro interno)

## Datas e números
- Datas sempre em ISO string (`2026-05-30T16:00:00.000Z`) no JSON; no banco são `DateTime`
- Campos monetários `Decimal` do Prisma (`valor`, `orcamentoPrevisto`) viram `number`/string decimal no JSON — nunca formatar no backend
- Datas de input chegam como string e são convertidas com `new Date(...)` antes do Prisma

## Imports
- Sempre usar alias `@/` — nunca caminhos relativos (`../../`)
- Caminhos válidos: `@/lib/prisma`, `@/lib/auth`, `@/lib/auth-helpers`, `@/lib/validations`, `@/components/*`, `@/data/*`

## Estrutura de arquivos Next.js
- Route Handlers: `route.ts` com exports nomeados (`GET`, `POST`, `PATCH`, `DELETE`)
- Páginas: `page.tsx` com `export default`; layouts: `layout.tsx` com `export default`
- Páginas do painel (`src/app/admin/**`) iniciam com `'use client';`
- Nunca misturar Pages Router (`_app.tsx`, `_document.tsx`) com App Router

## Async
- Toda chamada Prisma deve ser `await`ed — esquecer `await` causa erros silenciosos
- Helpers de sessão são async: `await auth()`, `await requireAuth()`, `await getSessionUser()`
- Route Handlers podem ser `async` diretamente (Next.js suporta)
