import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';
import { assertTargetUserScope, ORG_FORBIDDEN, orgForbiddenResponse } from '@/lib/tenant';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const requester = await requireAuth();
    const { id } = await params;

    const canEdit = await hasPermission(requester.id, 'Usuarios', 'editar');
    if (!canEdit && requester.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Sem permissão para alterar status' }, { status: 403 });
    }

    const body = await request.json();
    const { ativo } = body;

    if (typeof ativo !== 'boolean') {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    if (requester.id === id && !ativo) {
      return NextResponse.json({ error: 'Não e possível desativar seu próprio usuário' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    await assertTargetUserScope(requester, id, request);

    if (target.role === 'SUPER_ADMIN' && requester.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Não e possível alterar status de SUPER_ADMIN' }, { status: 403 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: { id },
        data: { ativo },
        select: { id: true, name: true, email: true, role: true, ativo: true },
      });

      await tx.auditLog.create({
        data: {
          userId: requester.id,
          acao: ativo ? 'ATIVAR_USUARIO' : 'DESATIVAR_USUARIO',
          entidade: 'User',
          entidadeId: id,
          detalhes: { nome: result.name },
        },
      });

      return result;
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      if (error.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    }
    return NextResponse.json({ error: 'Erro ao alterar status' }, { status: 500 });
  }
}
