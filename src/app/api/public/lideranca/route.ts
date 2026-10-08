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

    if (!organizacaoId) {
      return NextResponse.json({ lideres: [] });
    }

    const lideres = await prisma.lideranca.findMany({
      where: {
        organizacaoId,
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
    });

    return NextResponse.json({ lideres });
  } catch (error) {
    console.error('GET /api/public/lideranca error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
