import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Informacoes do rodapé do site publico.
 * Publico: nao exige sessao. Campos vazios/null sao omittidos — o client aplica fallback do site-data.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizacaoIdParam = searchParams.get('organizacaoId');

    let organizacaoId = organizacaoIdParam;
    if (!organizacaoId) {
      const padrao = await prisma.organizacao.findFirst({
        where: { ativo: true },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      organizacaoId = padrao?.id || null;
    }

    if (!organizacaoId) {
      return NextResponse.json({});
    }

    const config = await prisma.configuracoesIgreja.findUnique({
      where: { organizacaoId },
      select: {
        nomeIgreja: true,
        anoFundacao: true,
        rodapeDescricao: true,
        rodapeEndereco: true,
        rodapeTelefone: true,
        rodapeEmail: true,
        rodapeWhatsapp: true,
        rodapeYoutube: true,
        rodapeInstagram: true,
        rodapeFacebook: true,
      },
    });

    if (!config) {
      return NextResponse.json({});
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('GET /api/public/footer-info error:', error);
    return NextResponse.json({});
  }
}
