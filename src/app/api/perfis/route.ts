import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const user = await requireAuth();
    const podeVer = await hasPermission(user.id, 'usuarios', 'visualizar');
    if (!podeVer && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Sem permissao para listar perfis' }, { status: 403 });
    }

    const perfis = await prisma.perfil.findMany({
      include: {
        permissoes: {
          include: { permissao: true },
        },
      },
      orderBy: { nome: 'asc' },
    });
    return NextResponse.json(perfis);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro ao buscar perfis' }, { status: 500 });
  }
}
