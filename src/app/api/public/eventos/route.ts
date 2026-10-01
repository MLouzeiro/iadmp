import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');
    const limit = parseInt(searchParams.get('limit') || '4');

    const where: Record<string, unknown> = {
      publicarNoSite: true,
    };

    if (organizacaoId) {
      where.liturgias = { some: { organizacaoId } };
    }

    const eventos = await prisma.evento.findMany({
      where,
      select: {
        id: true,
        nome: true,
        tema: true,
        dataInicio: true,
        dataEvento: true,
        dataFim: true,
        local: true,
        status: true,
        preletores: true,
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
