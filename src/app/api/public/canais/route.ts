import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePublicOrganizacaoId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const organizacaoId = searchParams.get('organizacaoId');

    const orgId = await resolvePublicOrganizacaoId({ slug, organizacaoId });

    if (!orgId) {
      return NextResponse.json({ canais: [] });
    }

    const canais = await prisma.canalOficial.findMany({
      where: {
        organizacaoId: orgId,
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
