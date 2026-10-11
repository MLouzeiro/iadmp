import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePublicOrganizacaoId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

const ANOS_HISTORIA_PADRAO = 12;
const CONGREGACOES_PADRAO = 5;

/**
 * Estatisticas do hero do site publico.
 * Contagens automaticas do banco + flags de exibicao configuraveis no admin.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const organizacaoId = searchParams.get('organizacaoId');

    const orgId = await resolvePublicOrganizacaoId({ slug, organizacaoId });
    if (!orgId) {
      return NextResponse.json({ exibir: {} });
    }

    const config = await prisma.configuracoesIgreja.findUnique({
      where: { organizacaoId: orgId },
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
      prisma.membro.count({ where: { organizacaoId: orgId, status: 'ATIVO' } }),
      prisma.congregacao.count({ where: { organizacaoId: orgId, ativo: true } }),
      prisma.lideranca.count({ where: { organizacaoId: orgId, ativo: true } }),
      prisma.ministerio.count({ where: { organizacaoId: orgId, ativo: true } }),
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
