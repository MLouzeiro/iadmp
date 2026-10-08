import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';
import { writeAudit } from '@/lib/audit';
import { parseDataDateOnly } from '@/lib/datas';
import {
  assertOrgAccess,
  resolveCongregacaoId,
  ORG_FORBIDDEN,
  orgForbiddenResponse,
} from '@/lib/tenant';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const lancamento = await prisma.eventoFinanceiro.findUnique({
      where: { id },
      include: {
        congregacao: { select: { id: true, nome: true } },
        evento: { select: { id: true, nome: true } },
      },
    });
    if (!lancamento) return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 });
    await assertOrgAccess(user.id, lancamento.organizacaoId, request);
    return NextResponse.json(lancamento);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar lançamento' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeEditar = await hasPermission(user.id, 'financeiro', 'editar');
    if (!podeEditar) return NextResponse.json({ error: 'Sem permissão para editar lançamentos' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.eventoFinanceiro.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.descricao !== undefined) data.descricao = body.descricao;
    if (body.valor !== undefined) data.valor = body.valor;
    if (body.tipo !== undefined) data.generoMovimentacao = body.tipo;
    if (body.categoria !== undefined) data.categoria = body.categoria;
    if (body.fornecedor !== undefined) data.fornecedor = body.fornecedor || null;
    if (body.responsavel !== undefined) data.responsavel = body.responsavel || null;
    if (body.observacoes !== undefined) data.observacoes = body.observacoes || null;
    if (body.categoriaFinanceiraId !== undefined) data.categoriaFinanceiraId = body.categoriaFinanceiraId || null;
    if (body.data !== undefined) data.quando = body.data ? parseDataDateOnly(body.data) : new Date();
    if (body.congregacaoId !== undefined || body.congregacao !== undefined) {
      data.congregacaoId = await resolveCongregacaoId(existing.organizacaoId, {
        congregacaoId: body.congregacaoId,
        congregacao: body.congregacao,
      });
    }

    const lancamento = await prisma.eventoFinanceiro.update({
      where: { id },
      data,
      include: { congregacao: { select: { id: true, nome: true } } },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'UPDATE',
      entidade: 'EventoFinanceiro',
      entidadeId: lancamento.id,
      antes: existing,
      depois: lancamento,
      req: request,
    });

    return NextResponse.json(lancamento);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao atualizar lançamento' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeExcluir = await hasPermission(user.id, 'financeiro', 'excluir');
    if (!podeExcluir) return NextResponse.json({ error: 'Sem permissão para excluir lançamentos' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.eventoFinanceiro.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);

    await prisma.eventoFinanceiro.delete({ where: { id } });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'DELETE',
      entidade: 'EventoFinanceiro',
      entidadeId: id,
      antes: existing,
      req: request,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao excluir lançamento' }, { status: 500 });
  }
}
