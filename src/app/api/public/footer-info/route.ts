import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePublicOrganizacaoId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

/**
 * Informacoes do rodapé do site publico.
 * Publico: nao exige sessao. Campos vazios/null sao omittidos — o client aplica fallback do site-data.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const organizacaoId = searchParams.get('organizacaoId');

    const orgId = await resolvePublicOrganizacaoId({ slug, organizacaoId });

    if (!orgId) {
      return NextResponse.json({});
    }

    const config = await prisma.configuracoesIgreja.findUnique({
      where: { organizacaoId: orgId },
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
