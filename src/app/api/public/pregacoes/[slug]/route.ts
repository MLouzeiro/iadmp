import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const pregacao = await prisma.pregacao.findFirst({
      where: {
        slug,
        status: 'PUBLICADA',
      },
      select: {
        id: true,
        titulo: true,
        slug: true,
        descricao: true,
        tema: true,
        tipo: true,
        pregadorNome: true,
        data: true,
        referenciaLivro: true,
        referenciaCapitulo: true,
        referenciaVersIni: true,
        referenciaVersFim: true,
        videoUrl: true,
        capaUrl: true,
        destaque: true,
      },
    });

    if (!pregacao) {
      return NextResponse.json({ error: 'Pregação não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ pregacao });
  } catch (error) {
    console.error('GET /api/public/pregacoes/[slug] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
