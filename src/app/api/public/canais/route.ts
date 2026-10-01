import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');

    if (!organizacaoId) {
      return NextResponse.json({ error: 'organizacaoId e obrigatorio' }, { status: 400 });
    }

    const canais = await prisma.canalOficial.findMany({
      where: {
        organizacaoId,
        ativo: true,
      },
      select: {
        id: true,
        tipo: true,
        nome: true,
        url: true,
        descricao: true,
        ordem: true,
      },
      orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ canais });
  } catch (error) {
    console.error('GET /api/public/canais error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
