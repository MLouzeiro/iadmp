import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const versiculo = await prisma.versiculoDiario.findUnique({
      where: { id },
      include: {
        organizacao: { select: { id: true, nome: true } },
        historico: { orderBy: { slot: 'desc' }, take: 10 },
      },
    });

    if (!versiculo) {
      return NextResponse.json({ error: 'Versiculo nao encontrado' }, { status: 404 });
    }

    const podeVer = await canManageOrganization(user.id, versiculo.organizacaoId);
    if (!podeVer) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });

    return NextResponse.json({ versiculo });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    console.error('GET /api/admin/versiculos/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const hasPerm = await hasPermission(user.id, 'comunicacao', 'editar');
    if (!hasPerm) return NextResponse.json({ error: 'Sem permissao para editar versiculos' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { referencia, versiculo, reflexao, ativo } = body;

    const existing = await prisma.versiculoDiario.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Versiculo nao encontrado' }, { status: 404 });
    }

    const canManage = await canManageOrganization(user.id, existing.organizacaoId);
    if (!canManage) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });

    const updated = await prisma.versiculoDiario.update({
      where: { id },
      data: {
        ...(referencia !== undefined && { referencia }),
        ...(versiculo !== undefined && { versiculo }),
        ...(reflexao !== undefined && { reflexao }),
        ...(ativo !== undefined && { ativo }),
      },
      include: {
        organizacao: { select: { id: true, nome: true } },
      },
    });

    return NextResponse.json({ versiculo: updated });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    console.error('PUT /api/admin/versiculos/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const hasPerm = await hasPermission(user.id, 'comunicacao', 'excluir');
    if (!hasPerm) return NextResponse.json({ error: 'Sem permissao para excluir versiculos' }, { status: 403 });

    const { id } = await params;

    const existing = await prisma.versiculoDiario.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Versiculo nao encontrado' }, { status: 404 });
    }

    const canManage = await canManageOrganization(user.id, existing.organizacaoId);
    if (!canManage) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });

    await prisma.versiculoHistorico.deleteMany({ where: { versiculoId: id } });
    await prisma.versiculoDiario.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    console.error('DELETE /api/admin/versiculos/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
