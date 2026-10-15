import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Lista pública das organizações com site habilitado.
 * Usada pela seção "Nossas Congregações" do portal geral.
 * Não requer sessão. Não expõe dados administrativos.
 */
export async function GET() {
  try {
    const organizacoes = await prisma.organizacao.findMany({
      where: {
        ativo: true,
        sitePublico: true,
        slug: { not: null },
      },
      select: {
        id: true,
        nome: true,
        slug: true,
        descricao: true,
        configuracoes: {
          take: 1,
          select: {
            nomeIgreja: true,
            logoUrl: true,
            logoDarkUrl: true,
            rodapeEndereco: true,
            rodapeTelefone: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json({
      organizacoes: organizacoes.map((o) => ({
        id: o.id,
        nome: o.nome,
        slug: o.slug,
        descricao: o.descricao,
        logoUrl: o.configuracoes?.[0]?.logoUrl || o.configuracoes?.[0]?.logoDarkUrl || null,
        endereco: o.configuracoes?.[0]?.rodapeEndereco || null,
        telefone: o.configuracoes?.[0]?.rodapeTelefone || null,
      })),
    });
  } catch (error) {
    console.error('GET /api/public/congregacoes error:', error);
    return NextResponse.json({ organizacoes: [] });
  }
}
