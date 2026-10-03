import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const user = await requireAuth();
    const podeVer = await hasPermission(user.id, 'usuarios', 'visualizar');
    if (!podeVer && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Sem permissao para listar permissoes' }, { status: 403 });
    }

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
