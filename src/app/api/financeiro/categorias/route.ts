import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';
import { writeAudit } from '@/lib/audit';
import {
  resolveOrgScope,
  resolveTargetOrgId,
  ORG_FORBIDDEN,
  ORG_REQUIRED,
  orgForbiddenResponse,
} from '@/lib/tenant';

export const categoriaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(80),
  genero: z.enum(['ENTRADA', 'SAIDA'], { message: 'Gênero deve ser ENTRADA ou SAIDA' }),
  descricao: z.string().max(200).optional().or(z.literal('')),
  ativo: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeVer = await hasPermission(user.id, 'financeiro', 'visualizar');
    if (!podeVer) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');
    const scope = await resolveOrgScope(user, organizacaoId);

    const where: Record<string, unknown> = {};
    if (scope.requestedOrgId) {
      where.organizacaoId = scope.requestedOrgId;
    } else if (scope.mode !== 'ALL') {
      where.organizacaoId = { in: scope.orgIds };
    }

    const categorias = await prisma.categoriaFinanceira.findMany({
      where,
      orderBy: [{ genero: 'asc' }, { nome: 'asc' }],
    });

    return NextResponse.json(categorias);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeCriar = await hasPermission(user.id, 'financeiro', 'criar');
    if (!podeCriar) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const body = await request.json();
    const validated = categoriaSchema.parse(body);
    const organizacaoId = await resolveTargetOrgId(user, body.organizacaoId);

    const existente = await prisma.categoriaFinanceira.findFirst({
      where: { organizacaoId, nome: validated.nome },
      select: { id: true },
    });
    if (existente) {
      return NextResponse.json({ error: 'Já existe uma categoria com este nome' }, { status: 400 });
    }

    const categoria = await prisma.categoriaFinanceira.create({
      data: {
        organizacaoId,
        nome: validated.nome,
        genero: validated.genero,
        descricao: validated.descricao || null,
        ativo: validated.ativo ?? true,
      },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId,
      acao: 'CREATE',
      entidade: 'CategoriaFinanceira',
      entidadeId: categoria.id,
      depois: categoria,
      req: request,
    });

    return NextResponse.json(categoria, { status: 201 });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    if (error?.message === ORG_REQUIRED) {
      return NextResponse.json({ error: 'organizacaoId é obrigatório' }, { status: 400 });
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
  }
}
