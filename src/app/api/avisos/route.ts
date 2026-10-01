import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
  try {
    await requireAuth();
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
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    return NextResponse.json({ error: 'Erro ao buscar avisos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth();
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
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    return NextResponse.json({ error: 'Erro ao criar aviso' }, { status: 500 });
  }
}
