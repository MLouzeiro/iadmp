# Testes — IADMPMA

Framework: **Jest + ts-jest** (backend) e **Jest + React Testing Library** (frontend).

## Comandos

```bash
npm test          # roda uma vez
npm run test:watch  # modo watch
npm run test:ci   # CI com coverage
```

## Estrutura

```
__tests__/
├── api/          # Integração das API Routes (endpoint → status codes, RBAC)
├── lib/          # Unitários (validations Zod, auth-helpers)
├── hooks/        # Hooks React (jsdom via docblock)
└── components/   # Componentes React (jsdom via docblock)
```

## Regras (TDD)

- **Todo endpoint** de API e **todo helper** de auth/permissão deve ter pelo menos 1 teste **antes** da implementação (RED → GREEN)
- Backend roda em ambiente `node` (padrão do `jest.config.ts`)
- Frontend usa docblock no topo do arquivo:

```tsx
/**
 * @jest-environment jsdom
 */
```

## Padrão de teste de API

1. Não autenticado → `401`
2. Usuário sem permissão → `403`
3. Usuário com permissão → `200`/`201`
4. SUPER_ADMIN → `200`
5. Dados inválidos (Zod) → `400`

## Padrão de teste de página/hook (RTL)

- `render(<Componente />)`
- mockar `global.fetch` com `jest.fn()`
- assentar `loading`, lista vazia e estado de erro
- usar `screen.getByRole(...)` / `findByText(...)`

## Testes críticos do projeto

- [ ] Login com credenciais válidas cria sessão; credenciais inválidas retornam erro
- [ ] `requireAuth()` lança UNAUTHORIZED sem sessão; `requireSuperAdmin()` lança FORBIDDEN para não-SUPER_ADMIN
- [ ] Membro criado sem `nome` é rejeitado pelo `membroSchema`; criado com dados válidos é persistido
- [ ] Usuário comum não cria/edita usuários; SUPER_ADMIN pode (RBAC + `canAssignRole`)
- [ ] Rota `GET /api/public/eventos` responde sem sessão; `GET /api/usuarios` exige sessão
