import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePublicOrganizacaoId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const organizacaoId = searchParams.get('organizacaoId');
    const limit = parseInt(searchParams.get('limit') || '4');

    const orgId = await resolvePublicOrganizacaoId({ slug, organizacaoId });

    if (!orgId) {
      return NextResponse.json({ eventos: [] });
    }

    const eventos = await prisma.evento.findMany({
      where: {
        organizacaoId: orgId,
        publicarNoSite: true,
      },
      select: {
        id: true,
        nome: true,
        tema: true,
        dataInicio: true,
        dataEvento: true,
        dataFim: true,
        inscricoesAbremEm: true,
        inscricoesFechamEm: true,
        aceitaInscricoes: true,
        local: true,
        status: true,
        preletores: true,
        imagemUrl: true,
      },
      orderBy: { dataEvento: 'asc' },
      take: limit,
    });

    return NextResponse.json({ eventos });
  } catch (error) {
    console.error('GET /api/public/eventos error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
