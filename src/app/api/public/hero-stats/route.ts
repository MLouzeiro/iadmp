import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const ANOS_HISTORIA_PADRAO = 12;
const CONGREGACOES_PADRAO = 5;

async function resolverOrganizacaoId(request: NextRequest): Promise<string | null> {
  const { searchParams } = new URL(request.url);
  const organizacaoId = searchParams.get('organizacaoId');

  if (organizacaoId) {
    const org = await prisma.organizacao.findFirst({
      where: { id: organizacaoId, ativo: true },
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

/**
 * Estatisticas do hero do site publico.
 * Contagens automaticas do banco + flags de exibicao configuraveis no admin.
 */
export async function GET(request: NextRequest) {
  try {
    const organizacaoId = await resolverOrganizacaoId(request);
    if (!organizacaoId) {
      return NextResponse.json({ exibir: {} });
    }

    const config = await prisma.configuracoesIgreja.findUnique({
      where: { organizacaoId },
      select: {
        anoFundacao: true,
        statMembros: true,
        statCongregacoes: true,
        statLideres: true,
        statAnosHistoria: true,
        statMinisterios: true,
      },
    });

    const hoje = new Date();
    const anoAtual = hoje.getFullYear();

    const [membros, congregacoes, lideres, ministerios] = await Promise.all([
      prisma.membro.count({ where: { organizacaoId, status: 'ATIVO' } }),
      prisma.congregacao.count({ where: { organizacaoId, ativo: true } }),
      prisma.lideranca.count({ where: { organizacaoId, ativo: true } }),
      prisma.ministerio.count({ where: { organizacaoId, ativo: true } }),
    ]);

    const anosHistoria =
      config?.anoFundacao && config.anoFundacao > 0 && config.anoFundacao <= anoAtual
        ? anoAtual - config.anoFundacao
        : ANOS_HISTORIA_PADRAO;

    return NextResponse.json({
      membros,
      congregacoes: congregacoes > 0 ? congregacoes : CONGREGACOES_PADRAO,
      lideres,
      anosHistoria,
      ministerios,
      exibir: {
        membros: config?.statMembros ?? false,
        congregacoes: config?.statCongregacoes ?? true,
        lideres: config?.statLideres ?? true,
        anosHistoria: config?.statAnosHistoria ?? true,
        ministerios: config?.statMinisterios ?? true,
      },
    });
  } catch (error) {
    console.error('GET /api/public/hero-stats error:', error);
    return NextResponse.json({ exibir: {} });
  }
}
