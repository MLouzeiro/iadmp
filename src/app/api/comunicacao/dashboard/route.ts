import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, canManageOrganization } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');

    const where: Record<string, unknown> = {};
    if (organizacaoId) {
      const podeVer = await canManageOrganization(user.id, organizacaoId);
      if (!podeVer) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });
      where.organizacaoId = organizacaoId;
    }

    if (!organizacaoId && user.role !== 'SUPER_ADMIN') {
      const vinculos = await prisma.usuarioOrganizacao.findMany({
        where: { userId: user.id },
        select: { organizacaoId: true },
      });
      where.organizacaoId = { in: vinculos.map(v => v.organizacaoId) };
    }

    const [totalPregacoes, publicadas, rascunhos, arquivadas, canaisAtivos, ultimaPregacao] = await Promise.all([
      prisma.pregacao.count({ where }),
      prisma.pregacao.count({ where: { ...where, status: 'PUBLICADA' } }),
      prisma.pregacao.count({ where: { ...where, status: 'RASCUNHO' } }),
      prisma.pregacao.count({ where: { ...where, status: 'ARQUIVADA' } }),
      prisma.canalOficial.count({ where: { ...where, ativo: true } }),
      prisma.pregacao.findFirst({
        where: { ...where, status: 'PUBLICADA' },
        orderBy: { data: 'desc' },
        select: { id: true, titulo: true, data: true, pregadorNome: true, slug: true },
      }),
    ]);

    return NextResponse.json({
      totalPregacoes,
      publicadas,
      rascunhos,
      arquivadas,
      canaisAtivos,
      ultimaPregacao,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    console.error('GET /api/comunicacao/dashboard error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
