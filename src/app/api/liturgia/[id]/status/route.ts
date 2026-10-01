import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['RASCUNHO', 'EM_PREPARACAO', 'PRONTA', 'EM_ANDAMENTO', 'REALIZADA', 'CANCELADA'].includes(status)) {
      return NextResponse.json({ error: 'Status invalido' }, { status: 400 });
    }

    const hasPermCriar = await hasPermission(user.id, 'liturgia', 'criar');
    const hasPermEditar = await hasPermission(user.id, 'liturgia', 'editar');
    if (!hasPermCriar && !hasPermEditar) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });

    const existing = await prisma.liturgia.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Liturgia nao encontrada' }, { status: 404 });

    const podeAlterar = await canManageOrganization(user.id, existing.organizacaoId);
    if (!podeAlterar) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });

    if (status === 'EM_ANDAMENTO') {
      const hasPermIniciar = await hasPermission(user.id, 'liturgia', 'iniciar_culto');
      if (!hasPermIniciar) return NextResponse.json({ error: 'Sem permissao para iniciar culto' }, { status: 403 });
    }

    if (status === 'REALIZADA') {
      const hasPermFinalizar = await hasPermission(user.id, 'liturgia', 'finalizar_culto');
      if (!hasPermFinalizar) return NextResponse.json({ error: 'Sem permissao para finalizar culto' }, { status: 403 });
    }

    const liturgia = await prisma.liturgia.update({
      where: { id },
      data: { status, updatedById: user.id },
      include: { itens: { orderBy: { ordem: 'asc' } }, organizacao: { select: { id: true, nome: true } } },
    });

    return NextResponse.json({ liturgia });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    console.error('PATCH /api/liturgia/[id]/status error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}