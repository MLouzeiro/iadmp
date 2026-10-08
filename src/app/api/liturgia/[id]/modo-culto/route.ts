import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, canManageOrganization } from '@/lib/auth-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const liturgia = await prisma.liturgia.findUnique({
      where: { id },
      include: {
        itens: {
          orderBy: { ordem: 'asc' },
          include: { musica: true },
        },
        organizacao: { select: { nome: true } },
      },
    });

    if (!liturgia) return NextResponse.json({ error: 'Liturgia não encontrada' }, { status: 404 });

    const podeVer = await canManageOrganization(user.id, liturgia.organizacaoId);
    if (!podeVer) return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });

    return NextResponse.json({ liturgia });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    console.error('GET /api/liturgia/[id]/modo-culto error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}