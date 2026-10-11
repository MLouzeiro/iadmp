import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePublicOrganizacaoId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

/**
 * Resolve a organizacao do site publico por slug ou organizacaoId.
 * Retorna dados completos da organização para o ThemeProvider e páginas públicas.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const organizacaoId = searchParams.get('organizacaoId');

    const orgId = await resolvePublicOrganizacaoId({ slug, organizacaoId });

    if (!orgId) {
      return NextResponse.json({ organizacaoId: null, organizacao: null });
    }

    const organizacao = await prisma.organizacao.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        nome: true,
        slug: true,
        descricao: true,
        ativo: true,
      },
    });

    if (!organizacao) {
      return NextResponse.json({ organizacaoId: null, organizacao: null });
    }

    const config = await prisma.configuracoesIgreja.findUnique({
      where: { organizacaoId: orgId },
    });

    return NextResponse.json({
      organizacaoId: orgId,
      organizacao,
      configuracoes: config,
    });
  } catch (error) {
    console.error('GET /api/public/church-info error:', error);
    return NextResponse.json({ organizacaoId: null, organizacao: null });
  }
}
