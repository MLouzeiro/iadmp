import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const evento = await prisma.evento.findUnique({
      where: { id },
      include: { categoria: true, campanha: true, avaliacao: true, participantes: true, financeiro: true, tarefas: true },
    });
    if (!evento) {
      return NextResponse.json({ error: 'Evento nao encontrado' }, { status: 404 });
    }
    return NextResponse.json(evento);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar evento' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const evento = await prisma.evento.update({
      where: { id },
      data: {
        nome: body.nome,
        categoriaId: body.categoriaId,
        dataInicio: body.dataInicio ? new Date(body.dataInicio) : undefined,
        dataEvento: body.dataEvento ? new Date(body.dataEvento) : undefined,
        dataFim: body.dataFim ? new Date(body.dataFim) : undefined,
        tema: body.tema,
        preletores: body.preletores,
        diasDuracao: body.diasDuracao,
        status: body.status,
        observacoes: body.observacoes,
        local: body.local,
        responsavelGeral: body.responsavelGeral,
        publicarNoSite: body.publicarNoSite,
        orcamentoPrevisto: body.orcamentoPrevisto,
      },
      include: { categoria: true },
    });
    return NextResponse.json(evento);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar evento' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.evento.delete({ where: { id } });
    return NextResponse.json({ message: 'Evento excluido' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir evento' }, { status: 500 });
  }
}
