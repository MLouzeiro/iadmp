---
name: api-route-pattern
description: >-
  Gera API Routes completas seguindo as convenções do projeto: sessão via
  requireAuth/getSessionUser, RBAC com hasPermission (módulo:ação), escopo
  de organização, validação Zod de src/lib/validations.ts, tratamento de
  erros com try/catch e estrutura de pastas /api/{recurso}/[id]/route.ts.
---

# Skill: API Route Pattern

Cria ou modifica **API Routes (Next.js App Router Route Handlers)** seguindo
as convenções estabelecidas em `AGENTS.md` e o código existente do projeto.

## Estrutura de pastas

| Recurso | Arquivo |
|---------|---------|
| Listar/Criar | `src/app/api/{recurso}/route.ts` |
| Item específico | `src/app/api/{recurso}/[id]/route.ts` |
| Sub-recurso | `src/app/api/{recurso}/[id]/{sub}/route.ts` |
| Ação | `src/app/api/{recurso}/{acao}/route.ts` |
| Público (sem sessão) | `src/app/api/public/{recurso}/route.ts` |

## Template de código

### Rota de lista/criação (`route.ts`)

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasPermission, getUserOrganizations } from "@/lib/auth-helpers";
import { {recurso}Schema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await requireAuth(); // lança UNAUTHORIZED sem sessão

    // SUPER_ADMIN vê tudo; demais escopam pelas suas organizações
    const where = user.role === "SUPER_ADMIN"
      ? {}
      : {
          organizacaoId: {
            in: (await getUserOrganizations(user.id)).map((o) => o.organizacaoId),
          },
        };

    const data = await prisma.{model}.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(data);
  } catch (error) {
    if (String(error) === "Error: UNAUTHORIZED") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    // RBAC: permissão do módulo (formato modulo:acao)
    const allowed = await hasPermission(user.id, "{recurso}", "criar");
    if (!allowed && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const validated = {recurso}Schema.parse(body); // 400 no catch do ZodError

    const created = await prisma.{model}.create({
      data: {
        ...camposValidados,
        organizacaoId: user.role === "SUPER_ADMIN" ? validated.organizacaoId : organizacaoPrincipal,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (String(error) === "Error: UNAUTHORIZED") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
```

### Rota de item específico (`[id]/route.ts`)

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasPermission } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await requireAuth();

    const item = await prisma.{model}.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json(
        { error: "{Model} não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const allowed = await hasPermission(user.id, "{recurso}", "editar");
    if (!allowed && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();

    // Montar apenas campos enviados (PATCH parcial)
    const data: Record<string, unknown> = {};
    if (body.nome !== undefined) data.nome = body.nome;
    if (body.email !== undefined) data.email = body.email;
    // ... demais campos

    const updated = await prisma.{model}.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const allowed = await hasPermission(user.id, "{recurso}", "excluir");
    if (!allowed && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const item = await prisma.{model}.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json(
        { error: "{Model} não encontrado" },
        { status: 404 }
      );
    }

    // Preferir flag/status quando o modelo tiver referências
    await prisma.{model}.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
```

## RBAC por verbo HTTP

| Ação | Exigência |
|------|-----------|
| GET (painel) | `requireAuth()` |
| GET (público) | apenas em `src/app/api/public/**` — sem sessão |
| POST | `hasPermission(id, '<modulo>', 'criar')` |
| PATCH | `hasPermission(id, '<modulo>', 'editar')` |
| DELETE | `hasPermission(id, '<modulo>', 'excluir')` — preferir flag/status |

- **Nunca** aceitar `role`, `id` ou permissões vindos do body/query — sempre da sessão
- **Nunca** retornar `passwordHash` em nenhuma resposta
- SUPER_ADMIN vê todas as organizações; demais escopam por `getUserOrganizations()`

## Convenções de resposta

| Situação | HTTP | body |
|----------|------|------|
| Sucesso lista | `200` | `[...]` |
| Sucesso criação | `201` | `{ ... }` |
| Sucesso deleção | `200` | `{ "success": true }` |
| Não autenticado | `401` | `{ "error": "Não autenticado" }` |
| Acesso negado | `403` | `{ "error": "Acesso negado" }` |
| Não encontrado | `404` | `{ "error": "{Model} não encontrado" }` |
| Dados inválidos (Zod) | `400` | `{ "error": "mensagem do schema" }` |
| Erro interno | `500` | `{ "error": "Erro interno do servidor" }` |

## Regras de negócio

- **Validação**: sempre `schema.parse(body)` de `@/lib/validations.ts` antes de gravar
- **Datas**: string → `new Date(...)` na escrita; ISO string na leitura
- **Params Next.js**: `{ params }: { params: Promise<{ id: string }> }` com `await params`
- **Organização**: Liturgia, Pregacao, CanalOficial, VersiculoDiario etc. têm `organizacaoId` — escopar
- **Soft delete**: flags `ativo`, `status`, `situacaoAviso` quando houver referências

## Quando NÃO usar esta skill

- **Rotas públicas** (`src/app/api/public/*`) — omitir `requireAuth()` (é o único caso)
- **Testes** (`__tests__/`) — usar padrão de testes de `__tests__/api/`
- **Páginas React** (`src/app/**/page.tsx`) — não são API Routes
- **Componentes** (`src/components/`) — não são API Routes
- **Middleware** (`src/middleware.ts`) — usa `NextMiddleware`, não Route Handler
