import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
  try {
    await requireAuth();
    const permissoes = await prisma.permissao.findMany({
      orderBy: [{ modulo: 'asc' }, { acao: 'asc' }],
    });
    return NextResponse.json(permissoes);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro ao buscar permissoes' }, { status: 500 });
  }
}
