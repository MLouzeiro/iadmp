# Regras de Testes (Jest, RTL)

Aplica para: `__tests__/**`

## Organização
- `__tests__/api/` — testes de integração das API Routes
- `__tests__/lib/` — testes unitários de libs (`validations.ts`, `auth-helpers.ts`)
- `__tests__/hooks/` — testes de hooks React
- `__tests__/components/` — testes de componentes (docblock `@jest-environment jsdom`)
- Nomes de arquivo: `{modulo}.test.ts` (backend) ou `{modulo}.test.tsx` (frontend)

## Estrutura dos testes
- Usar `describe` + it blocks — nunca `test()` no nível superior
- `describe("/api/membros")` para agrupar por endpoint, `it("retorna 401 sem sessão")` para cenários

## Auth em testes de API
- NUNCA mockar a lógica de permissão internamente — testar o resultado real
- Sessão NextAuth em testes de integração: mockar `await auth()`/`requireAuth` de `@/lib/auth-helpers` via `jest.mock`, ou testar a camada de helpers isoladamente
- Testar os três níveis quando houver RBAC: sem sessão (401), sessão sem permissão (403), sessão com permissão (200)
- Nunca hardcode `NEXTAUTH_SECRET` real em teste

## Validação
- Testar schemas Zod de `@/lib/validations.ts` direto (`schema.safeParse`) — é a forma mais rápida de cobrir regra de negócio de entrada

## Cleanup
- Deletar ou desativar registros criados entre testes (`afterEach` ou `afterAll`)
- Nunca assumir que o banco está vazio — o seed cria perfis, SUPER_ADMIN e `ConfiguracoesIgreja`

## Cobertura mínima por endpoint
1. Não autenticado → 401
2. Usuário sem permissão do módulo → 403
3. Usuário com permissão → 200/201
4. SUPER_ADMIN → 200 em tudo
5. Dados inválidos → 400
