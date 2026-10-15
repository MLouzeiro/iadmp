import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePublicOrganizacaoId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const organizacaoId = searchParams.get('organizacaoId');
    const limit = parseInt(searchParams.get('limit') || '0', 10);

    const orgId = await resolvePublicOrganizacaoId({ slug, organizacaoId });

    if (!orgId) {
      return NextResponse.json({ lideres: [] });
    }

    const lideres = await prisma.lideranca.findMany({
      where: {
        organizacaoId: orgId,
        publico: true,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        cargo: true,
        foto: true,
        ordemExibicao: true,
        congregacao: { select: { id: true, nome: true } },
      },
      orderBy: { ordemExibicao: 'asc' },
      ...(limit > 0 ? { take: limit } : {}),
    });

    return NextResponse.json({ lideres });
  } catch (error) {
    console.error('GET /api/public/lideranca error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
