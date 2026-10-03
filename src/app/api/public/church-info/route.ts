import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Resolve a organizacao do site publico.
 * Aceita `?organizacaoId=` explicito; sem ele, usa a organizacao padrao
 * (a mais antiga ativa) para manter compatibilidade com implantacao single-tenant.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');

    if (organizacaoId) {
      const organizacao = await prisma.organizacao.findFirst({
        where: { id: organizacaoId, ativo: true },
        select: { id: true },
      });
      return NextResponse.json({ organizacaoId: organizacao?.id || null });
    }

    const padrao = await prisma.organizacao.findFirst({
      where: { ativo: true },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ organizacaoId: padrao?.id || null });
  } catch (error) {
    console.error('GET /api/public/church-info error:', error);
    return NextResponse.json({ organizacaoId: null });
  }
}
