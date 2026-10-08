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
    const oportunidade = await prisma.oportunidade.findUnique({
      where: { id },
      include: { congregacao: { select: { id: true, nome: true } } },
    });
    if (!oportunidade) return NextResponse.json({ error: 'Oportunidade não encontrada' }, { status: 404 });
    await assertOrgAccess(user.id, oportunidade.organizacaoId, request);
    return NextResponse.json(oportunidade);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar oportunidade' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeEditar = await hasPermission(user.id, 'oportunidades', 'editar');
    if (!podeEditar) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.oportunidade.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Oportunidade não encontrada' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.titulo !== undefined) data.titulo = body.titulo;
    if (body.descricao !== undefined) data.descricao = body.descricao;
    if (body.generoOportunidade !== undefined) data.generoOportunidade = body.generoOportunidade;
    if (body.responsavel !== undefined) data.responsavel = body.responsavel || null;
    if (body.prazo !== undefined) data.prazo = body.prazo ? parseDataDateOnly(body.prazo) : null;
    if (body.vagas !== undefined) data.vagas = body.vagas ?? null;
    if (body.abrirOportunidade !== undefined) data.abrirOportunidade = body.abrirOportunidade;
    if (body.observacoes !== undefined) data.observacoes = body.observacoes || null;
    if (body.congregacaoId !== undefined || body.congregacao !== undefined) {
      data.congregacaoId = await resolveCongregacaoId(existing.organizacaoId, {
        congregacaoId: body.congregacaoId,
        congregacao: body.congregacao,
      });
    }

    const oportunidade = await prisma.oportunidade.update({
      where: { id },
      data,
      include: { congregacao: { select: { id: true, nome: true } } },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'UPDATE',
      entidade: 'Oportunidade',
      entidadeId: oportunidade.id,
      antes: existing,
      depois: oportunidade,
      req: request,
    });

    return NextResponse.json(oportunidade);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao atualizar oportunidade' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeExcluir = await hasPermission(user.id, 'oportunidades', 'excluir');
    if (!podeExcluir) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.oportunidade.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Oportunidade não encontrada' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);

    await prisma.oportunidade.delete({ where: { id } });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'DELETE',
      entidade: 'Oportunidade',
      entidadeId: id,
      antes: existing,
      req: request,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao excluir oportunidade' }, { status: 500 });
  }
}
