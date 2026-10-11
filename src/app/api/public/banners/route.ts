import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePublicOrganizacaoId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

/**
 * Banners e flyers ativos do site publico (carrossel do topo).
 * Publico: nao exige sessao. Filtra por janela de datas quando definida.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const organizacaoIdParam = searchParams.get('organizacaoId');

    const orgId = await resolvePublicOrganizacaoId({ slug, organizacaoId: organizacaoIdParam });

    if (!orgId) {
      return NextResponse.json([]);
    }

    const agora = new Date();
    const banners = await prisma.banner.findMany({
      where: {
        organizacaoId: orgId,
        ativo: true,
        AND: [
          { OR: [{ dataInicio: null }, { dataInicio: { lte: agora } }] },
          { OR: [{ dataFim: null }, { dataFim: { gte: agora } }] },
        ],
      },
      select: {
        id: true,
        titulo: true,
        imagemUrl: true,
        tipo: true,
        link: true,
        ordem: true,
      },
      orderBy: { ordem: 'asc' },
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error('GET /api/public/banners error:', error);
    return NextResponse.json([]);
  }
}
