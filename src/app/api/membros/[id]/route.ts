import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const membro = await prisma.membro.findUnique({
      where: { id },
      include: { ministerio: true, departamento: true, lideranca: true },
    });
    if (!membro) {
      return NextResponse.json({ error: 'Membro nao encontrado' }, { status: 404 });
    }
    return NextResponse.json(membro);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar membro' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const membro = await prisma.membro.update({
      where: { id },
      data: {
        nome: body.nome,
        email: body.email,
        telefone: body.telefone,
        whatsapp: body.whatsapp,
        dataNascimento: body.dataNascimento ? new Date(body.dataNascimento) : undefined,
        endereco: body.endereco,
        congregacao: body.congregacao,
        status: body.status,
        observacoes: body.observacoes,
        ministerioId: body.ministerioId,
        departamentoId: body.departamentoId,
      },
    });
    return NextResponse.json(membro);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar membro' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.membro.delete({ where: { id } });
    return NextResponse.json({ message: 'Membro excluido' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir membro' }, { status: 500 });
  }
}
