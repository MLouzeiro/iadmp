import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';

// PATCH /api/storage/alertas/[id] — marcar como lido ou resolvido
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const podeGerenciar = user.role === 'SUPER_ADMIN' || (await hasPermission(user.id, 'configuracoes', 'editar'));
    if (!podeGerenciar) {
      return NextResponse.json({ error: 'Sem permissão para gerenciar alertas.' }, { status: 403 });
    }

    const alerta = await prisma.storageAlert.findUnique({ where: { id } });
    if (!alerta) {
      return NextResponse.json({ error: 'Alerta não encontrado.' }, { status: 404 });
    }
    if (alerta.organizacaoId && user.role !== 'SUPER_ADMIN' && !(await canManageOrganization(user.id, alerta.organizacaoId))) {
      return NextResponse.json({ error: 'Sem permissão para este alerta.' }, { status: 403 });
    }

    const body = await request.json();
    const { acao } = body; // 'lido' | 'resolvido'

    if (acao !== 'lido' && acao !== 'resolvido') {
      return NextResponse.json({ error: 'Ação inválida. Use "lido" ou "resolvido".' }, { status: 400 });
    }

    const dados = acao === 'lido'
      ? { status: alerta.status === 'RESOLVIDO' ? 'RESOLVIDO' : 'LIDO', lidoEm: alerta.lidoEm || new Date() }
      : { status: 'RESOLVIDO', resolvidoEm: new Date(), lidoEm: alerta.lidoEm || new Date() };

    const atualizado = await prisma.storageAlert.update({ where: { id }, data: dados });

    await writeAudit({
      userId: user.id,
      organizacaoId: alerta.organizacaoId,
      acao: acao === 'lido' ? 'MARCAR_ALERTA_LIDO' : 'MARCAR_ALERTA_RESOLVIDO',
      entidade: 'StorageAlert',
      entidadeId: id,
      depois: { status: atualizado.status },
      req: request,
    });

    return NextResponse.json({ id: atualizado.id, status: atualizado.status });
  } catch (e) {
    return NextResponse.json({ error: `Erro ao atualizar alerta: ${(e as Error).message}` }, { status: 500 });
  }
}
