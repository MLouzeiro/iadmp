import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const membro = await prisma.membro.findUnique({
      where: { id },
      include: { ministerio: true, departamento: true, lideranca: true },
    });
    if (!membro) {
      return NextResponse.json({ error: 'Membro nao encontrado' }, { status: 404 });
    }
    return NextResponse.json(membro);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    return NextResponse.json({ error: 'Erro ao buscar membro' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
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
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    return NextResponse.json({ error: 'Erro ao atualizar membro' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    await prisma.membro.delete({ where: { id } });
    return NextResponse.json({ message: 'Membro excluido' });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    return NextResponse.json({ error: 'Erro ao excluir membro' }, { status: 500 });
  }
}
