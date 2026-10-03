import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function resolveOrganizacaoId(requested: string | null): Promise<string | null> {
  if (requested) {
    const org = await prisma.organizacao.findFirst({
      where: { id: requested, ativo: true },
      select: { id: true },
    });
    return org?.id || null;
  }
  const padrao = await prisma.organizacao.findFirst({
    where: { ativo: true },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  return padrao?.id || null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizacaoId = await resolveOrganizacaoId(searchParams.get('organizacaoId'));
    const limit = parseInt(searchParams.get('limit') || '4');

    if (!organizacaoId) {
      return NextResponse.json({ eventos: [] });
    }

    const eventos = await prisma.evento.findMany({
      where: {
        organizacaoId,
        publicarNoSite: true,
      },
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
