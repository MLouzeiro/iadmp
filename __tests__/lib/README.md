# Testes unitários — libs

Arquivos cobertos:

- `validations.test.ts` — schemas Zod de `src/lib/validations.ts` (membro, evento, aviso, liturgia, financeiro, login)
- `auth-helpers.test.ts` — `requireAuth()`, `requireSuperAdmin()`, `hasPermission()`, `canAssignRole()` (criar junto com a implementação)

## Padrão

```typescript
import { membroSchema } from '@/lib/validations';

it('rejeita membro sem nome', () => {
  const result = membroSchema.safeParse({ nome: '' });
  expect(result.success).toBe(false);
});
```

Ambiente `node` (padrão do `jest.config.ts`) — sem jsdom necessário.
