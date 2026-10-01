# Regras de Backend (API Routes, Prisma, Auth)

Aplica para: `src/app/api/**`, `src/lib/**`, `prisma/**`

## Autenticação em toda rota protegida
- Ler sessão com `await auth()` ou `await requireAuth()` de `@/lib/auth-helpers`
- Sem sessão → `401 { error: "Não autenticado" }` (ou `requireAuth()` que lança `UNAUTHORIZED`)
- Só SUPER_ADMIN → `await requireSuperAdmin()` (lança `FORBIDDEN`) ou checar `user.role === 'SUPER_ADMIN'`
- Permissão granular → `await hasPermission(userId, 'membros', 'criar')` → `403` se falso
- Rotas em `src/app/api/public/**` são as ÚNICAS que respondem sem sessão

## Escopo por organização
- Usuários não-SUPER_ADMIN só enxergam dados das organizações vinculadas (`UsuarioOrganizacao`)
- Filtrar queries por `organizacaoId` quando o modelo tiver esse campo (Liturgia, Pregacao, CanalOficial, ...)
- O filtro é aplicado DEPOIS de confirmar a sessão/permissão, nunca antes

## Validação
- Validar o body com o schema Zod de `@/lib/validations.ts` ANTES do Prisma (`schema.parse(body)`)
- Schema inválido → `400 { error: "mensagem" }` (mensagem legível em português)
- Backend NUNCA confia na validação do frontend

## Soft delete / flags
- `User.ativo`, `Membro.status`, `Aviso.situacaoAviso`, `Evento.status`, `Liturgia.status` — preferir flag/status a DELETE físico
- DELETE físico só quando não há referências (ou com `onDelete: Cascade` já previsto no schema)

## Params e PATCH
- Params Next.js: `{ params }: { params: Promise<{ id: string }> }` com `await params`
- PATCH parcial: montar `data: Record<string, unknown>` apenas com campos enviados (`if (body.x !== undefined)`)

## Prisma
- Instância única via `@/lib/prisma` (singleton globalThis) — nunca `new PrismaClient()` fora dela
- `Decimal` do schema vira `number` no JSON — converter na resposta se necessário
- Toda chamada `await`ed; `try/catch` com 500 genérico no catch
