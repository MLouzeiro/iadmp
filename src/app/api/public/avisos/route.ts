import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePublicOrganizacaoId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

/**
 * Avisos públicos do site: publicarSite=true, situação ATIVO e dentro da janela de exibição.
 * Parâmetros: slug | organizacaoId (mesmo contrato das demais rotas públicas), limit (default 5).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const organizacaoId = searchParams.get('organizacaoId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10) || 5, 20);

    const orgId = await resolvePublicOrganizacaoId({ slug, organizacaoId });

    if (!orgId) {
      return NextResponse.json({ avisos: [] });
    }

    const agora = new Date();

    const avisos = await prisma.aviso.findMany({
      where: {
        organizacaoId: orgId,
        publicarSite: true,
        situacaoAviso: 'ATIVO',
        comecaEm: { lte: agora },
        OR: [{ terminaEm: null }, { terminaEm: { gte: agora } }],
      },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        imagem: true,
        categoria: true,
        urgencia: true,
        destaque: true,
        comecaEm: true,
        terminaEm: true,
      },
      orderBy: [{ destaque: 'desc' }, { comecaEm: 'desc' }],
      take: limit,
    });

    return NextResponse.json({ avisos });
  } catch (error) {
    console.error('GET /api/public/avisos error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
