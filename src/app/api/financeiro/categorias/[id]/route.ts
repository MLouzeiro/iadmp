import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';
import { writeAudit } from '@/lib/audit';
import {
  assertOrgAccess,
  ORG_FORBIDDEN,
  orgForbiddenResponse,
} from '@/lib/tenant';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const categoria = await prisma.categoriaFinanceira.findUnique({ where: { id } });
    if (!categoria) return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    await assertOrgAccess(user.id, categoria.organizacaoId, request);
    return NextResponse.json(categoria);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar categoria' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeEditar = await hasPermission(user.id, 'financeiro', 'editar');
    if (!podeEditar) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.categoriaFinanceira.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.nome !== undefined) data.nome = body.nome;
    if (body.genero !== undefined) data.genero = body.genero;
    if (body.descricao !== undefined) data.descricao = body.descricao || null;
    if (body.ativo !== undefined) data.ativo = Boolean(body.ativo);

    const categoria = await prisma.categoriaFinanceira.update({ where: { id }, data });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'UPDATE',
      entidade: 'CategoriaFinanceira',
      entidadeId: categoria.id,
      antes: existing,
      depois: categoria,
      req: request,
    });

    return NextResponse.json(categoria);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeExcluir = await hasPermission(user.id, 'financeiro', 'editar');
    if (!podeExcluir) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.categoriaFinanceira.findUnique({
      where: { id },
      include: { _count: { select: { movimentacoes: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);

    if (existing._count.movimentacoes > 0) {
      return NextResponse.json(
        { error: 'Categoria possui lançamentos vinculados. Desative-a em vez de excluir.' },
        { status: 400 }
      );
    }

    await prisma.categoriaFinanceira.delete({ where: { id } });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'DELETE',
      entidade: 'CategoriaFinanceira',
      entidadeId: id,
      antes: existing,
      req: request,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao excluir categoria' }, { status: 500 });
  }
}
