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
    const lider = await prisma.lideranca.findUnique({
      where: { id },
      include: { ministerio: true, membro: true },
    });
    if (!lider) {
      return NextResponse.json({ error: 'Lider nao encontrado' }, { status: 404 });
    }
    return NextResponse.json(lider);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    return NextResponse.json({ error: 'Erro ao buscar lider' }, { status: 500 });
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
    const lider = await prisma.lideranca.update({
      where: { id },
      data: {
        nome: body.nome,
        cargo: body.cargo,
        biografia: body.biografia,
        ordemExibicao: body.ordemExibicao,
        publico: body.publico,
        ativo: body.ativo,
        dataInicio: body.dataInicio ? new Date(body.dataInicio) : undefined,
        dataFim: body.dataFim ? new Date(body.dataFim) : undefined,
        membroId: body.membroId,
        ministerioId: body.ministerioId,
      },
    });
    return NextResponse.json(lider);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    return NextResponse.json({ error: 'Erro ao atualizar lider' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    await prisma.lideranca.delete({ where: { id } });
    return NextResponse.json({ message: 'Lider excluido' });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    return NextResponse.json({ error: 'Erro ao excluir lider' }, { status: 500 });
  }
}
