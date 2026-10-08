import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';
import { writeAudit } from '@/lib/audit';
import {
  assertOrgAccess,
  ORG_FORBIDDEN,
  orgForbiddenResponse,
} from '@/lib/tenant';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inscricaoId: string }> }
) {
  try {
    const user = await requireAuth();
    const podeEditar = await hasPermission(user.id, 'eventos', 'editar');
    if (!podeEditar) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { inscricaoId } = await params;
    const existing = await prisma.inscricao.findUnique({
      where: { id: inscricaoId },
      include: { pagamentos: true },
    });
    if (!existing) return NextResponse.json({ error: 'Inscrição não encontrada' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.nome !== undefined) data.nome = body.nome;
    if (body.email !== undefined) data.email = body.email || null;
    if (body.telefone !== undefined) data.telefone = body.telefone || null;
    if (body.observacoes !== undefined) data.observacoes = body.observacoes || null;
    if (body.valorPago !== undefined) data.valorPago = body.valorPago;

    if (body.checkIn !== undefined) {
      data.checkIn = Boolean(body.checkIn);
      data.dataCheckIn = body.checkIn ? new Date() : null;
    }

    // Confirmação de pagamento via PIX: marca pagamento como PAGO e inscrição CONFIRMADA
    if (body.confirmarPagamento) {
      const pendente = existing.pagamentos.find((p) => p.status !== 'PAGO' && p.status !== 'ESTORNADO');
      if (pendente) {
        await prisma.pagamento.update({
          where: { id: pendente.id },
          data: { status: 'PAGO', dataPagamento: new Date() },
        });
      }
      data.valorPago = existing.valorPrevisto ?? existing.valorPago;
      data.status = 'CONFIRMADA';
    }

    const inscricao = await prisma.inscricao.update({
      where: { id: inscricaoId },
      data,
      include: {
        membro: { select: { id: true, nome: true } },
        pagamentos: { select: { id: true, valor: true, forma: true, status: true, dataPagamento: true } },
      },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'UPDATE',
      entidade: 'Inscricao',
      entidadeId: inscricao.id,
      antes: existing,
      depois: inscricao,
      req: request,
    });

    return NextResponse.json(inscricao);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao atualizar inscrição' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inscricaoId: string }> }
) {
  try {
    const user = await requireAuth();
    const podeExcluir = await hasPermission(user.id, 'eventos', 'editar');
    if (!podeExcluir) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { inscricaoId } = await params;
    const existing = await prisma.inscricao.findUnique({ where: { id: inscricaoId } });
    if (!existing) return NextResponse.json({ error: 'Inscrição não encontrada' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);

    await prisma.inscricao.delete({ where: { id: inscricaoId } });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'DELETE',
      entidade: 'Inscricao',
      entidadeId: inscricaoId,
      antes: existing,
      req: request,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao excluir inscrição' }, { status: 500 });
  }
}
