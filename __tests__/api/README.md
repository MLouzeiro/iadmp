# Testes de integração — API Routes

Cada arquivo cobre um recurso: `membros.test.ts`, `eventos.test.ts`, etc.

## Padrão

```typescript
import { prisma } from '@/lib/prisma';

describe('POST /api/{recurso}', () => {
  it('retorna 401 sem sessão', async () => {});
  it('retorna 403 sem permissão do módulo', async () => {});
  it('cria recurso com permissão', async () => {});
  it('SUPER_ADMIN pode criar', async () => {});
  it('retorna 400 com dados inválidos (Zod)', async () => {});
});

afterEach(async () => {
  // cleanup dos registros criados no teste
});
```

## Cenários mínimos por endpoint

| Verbo | Cenários |
|-------|----------|
| GET | 401 sem sessão; 200 com sessão; escopo de organização |
| POST | 401; 403 sem `criar`; 201 com permissão; 400 com Zod inválido |
| PATCH | 401; 403 sem `editar`; 200 com permissão; 404 id inexistente |
| DELETE | 401; 403 sem `excluir`; 200 com permissão; 404 id inexistente |

Rotas em `src/app/api/public/**` são as únicas que devem responder **sem** sessão.
