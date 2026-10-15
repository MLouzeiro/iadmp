import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePublicOrganizacaoId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

/**
 * Programação pública (liturgias/cultos futuros ou em andamento).
 * Não expõe RASCUNHO nem CANCELADA. Não expõe observações internas ou userIds.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const organizacaoId = searchParams.get('organizacaoId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '8', 10) || 8, 30);

    const orgId = await resolvePublicOrganizacaoId({ slug, organizacaoId });

    if (!orgId) {
      return NextResponse.json({ programacao: [] });
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const liturgias = await prisma.liturgia.findMany({
      where: {
        organizacaoId: orgId,
        data: { gte: hoje },
        status: { notIn: ['RASCUNHO', 'CANCELADA'] },
      },
      select: {
        id: true,
        data: true,
        horarioInicio: true,
        horarioFimPrevisto: true,
        tipoCulto: true,
        tema: true,
        dirigente: true,
        pregador: true,
      },
      orderBy: [{ data: 'asc' }, { horarioInicio: 'asc' }],
      take: limit,
    });

    const programacao = liturgias.map((l) => ({
      id: l.id,
      data: l.data,
      horarioInicio: l.horarioInicio,
      horarioFimPrevisto: l.horarioFimPrevisto,
      tipoCulto: l.tipoCulto,
      tema: l.tema,
      dirigente: l.dirigente || null,
      pregador: l.pregador || null,
    }));

    return NextResponse.json({ programacao });
  } catch (error) {
    console.error('GET /api/public/programacao error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
