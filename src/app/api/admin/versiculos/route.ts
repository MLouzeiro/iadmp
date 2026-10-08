import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');
    const ativo = searchParams.get('ativo');

    const where: Record<string, unknown> = {};
    if (organizacaoId) {
      const podeVer = await canManageOrganization(user.id, organizacaoId);
      if (!podeVer) return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
      where.organizacaoId = organizacaoId;
    }
    if (ativo !== null && ativo !== undefined && ativo !== '') where.ativo = ativo === 'true';

    if (!organizacaoId && user.role !== 'SUPER_ADMIN') {
      const vinculos = await prisma.usuarioOrganizacao.findMany({
        where: { userId: user.id },
        select: { organizacaoId: true },
      });
      where.organizacaoId = { in: vinculos.map(v => v.organizacaoId) };
    }

    const versiculos = await prisma.versiculoDiario.findMany({
      where,
      include: {
        organizacao: { select: { id: true, nome: true } },
        _count: { select: { historico: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ versiculos });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('GET /api/admin/versiculos error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const hasPerm = await hasPermission(user.id, 'comunicacao', 'criar');
    if (!hasPerm) return NextResponse.json({ error: 'Sem permissão para criar versículos' }, { status: 403 });

    const body = await request.json();
    const { organizacaoId, referencia, versiculo, reflexao, ativo } = body;

    if (!organizacaoId || !referencia || !versiculo || !reflexao) {
      return NextResponse.json({ error: 'Selecione a organiza\u00e7\u00e3o e preencha refer\u00eancia, vers\u00edculo e reflex\u00e3o' }, { status: 400 });
    }

    const canManage = await canManageOrganization(user.id, organizacaoId);
    if (!canManage) return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });

    const novoVersiculo = await prisma.versiculoDiario.create({
      data: {
        organizacaoId,
        referencia,
        versiculo,
        reflexao,
        ativo: ativo !== undefined ? ativo : true,
        createdById: user.id,
      },
      include: {
        organizacao: { select: { id: true, nome: true } },
      },
    });

    return NextResponse.json({ versiculo: novoVersiculo }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('POST /api/admin/versiculos error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
