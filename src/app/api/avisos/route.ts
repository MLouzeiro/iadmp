import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const avisos = await prisma.aviso.findMany({
      where: {
        publicarSite: true,
        situacaoAviso: 'ATIVO',
        OR: [
          { terminaEm: null },
          { terminaEm: { gte: now } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(avisos);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar avisos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const aviso = await prisma.aviso.create({
      data: {
        titulo: body.titulo,
        descricao: body.descricao,
        imagem: body.imagem || null,
        categoria: body.categoria || null,
        comecaEm: body.comecaEm ? new Date(body.comecaEm) : new Date(),
        terminaEm: body.terminaEm ? new Date(body.terminaEm) : null,
        urgencia: body.urgencia || 'NORMAL',
        situacaoAviso: body.situacaoAviso || 'ATIVO',
        publicoAlvo: body.publicoAlvo || null,
        publicarSite: body.publicarSite ?? false,
        mostrarPainel: body.mostrarPainel ?? true,
        destaque: body.destaque ?? false,
      },
    });
    return NextResponse.json(aviso, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar aviso' }, { status: 500 });
  }
}
