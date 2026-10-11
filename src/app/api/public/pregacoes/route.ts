import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePublicOrganizacaoId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const organizacaoId = searchParams.get('organizacaoId');
    const limit = parseInt(searchParams.get('limit') || '6');

    const orgId = await resolvePublicOrganizacaoId({ slug, organizacaoId });

    if (!orgId) {
      return NextResponse.json({ pregacoes: [] });
    }

    const pregacoes = await prisma.pregacao.findMany({
      where: {
        organizacaoId: orgId,
        status: 'PUBLICADA',
      },
      select: {
        id: true,
        titulo: true,
        slug: true,
        descricao: true,
        tema: true,
        tipo: true,
        pregadorNome: true,
        data: true,
        referenciaLivro: true,
        referenciaCapitulo: true,
        referenciaVersIni: true,
        referenciaVersFim: true,
        videoUrl: true,
        capaUrl: true,
        destaque: true,
      },
      orderBy: { data: 'desc' },
      take: limit,
    });

    return NextResponse.json({ pregacoes });
  } catch (error) {
    console.error('GET /api/public/pregacoes error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
