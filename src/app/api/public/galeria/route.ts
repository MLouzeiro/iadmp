import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePublicOrganizacaoId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

/**
 * Galeria de fotos do site publico.
 * Publico: nao exige sessao. Filtra pela organizacao resolvida (slug ou default).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const organizacaoIdParam = searchParams.get('organizacaoId');
    const limitParam = parseInt(searchParams.get('limit') || '0', 10);

    const orgId = await resolvePublicOrganizacaoId({ slug, organizacaoId: organizacaoIdParam });

    if (!orgId) {
      return NextResponse.json({ imagens: [] });
    }

    const imagens = await prisma.galeriaItem.findMany({
      where: { organizacaoId: orgId },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        url: true,
        ordem: true,
        momentoItem: true,
      },
      orderBy: { ordem: 'asc' },
      ...(limitParam > 0 ? { take: limitParam } : {}),
    });

    return NextResponse.json({ imagens });
  } catch (error) {
    console.error('GET /api/public/galeria error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
