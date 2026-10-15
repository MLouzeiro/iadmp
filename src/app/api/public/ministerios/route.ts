import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePublicOrganizacaoId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

/**
 * Ministérios públicos (somente ativos) da organização resolvida.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const organizacaoId = searchParams.get('organizacaoId');

    const orgId = await resolvePublicOrganizacaoId({ slug, organizacaoId });

    if (!orgId) {
      return NextResponse.json({ ministerios: [] });
    }

    const ministerios = await prisma.ministerio.findMany({
      where: {
        organizacaoId: orgId,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        descricao: true,
        responsavel: true,
      },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json({ ministerios });
  } catch (error) {
    console.error('GET /api/public/ministerios error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
