import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';
import { writeAudit } from '@/lib/audit';
import {
  assertOrgAccess,
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
    const ministerio = await prisma.ministerio.findUnique({ where: { id } });
    if (!ministerio) return NextResponse.json({ error: 'Ministério não encontrado' }, { status: 404 });
    await assertOrgAccess(user.id, ministerio.organizacaoId, request);
    return NextResponse.json(ministerio);
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (err.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar ministério' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeEditar = await hasPermission(user.id, 'ministerios', 'editar');
    if (!podeEditar) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.ministerio.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Ministério não encontrado' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.nome !== undefined) data.nome = body.nome;
    if (body.descricao !== undefined) data.descricao = body.descricao || null;
    if (body.responsavel !== undefined) data.responsavel = body.responsavel || null;
    if (body.ativo !== undefined) data.ativo = body.ativo;

    const ministerio = await prisma.ministerio.update({ where: { id }, data });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'UPDATE',
      entidade: 'Ministerio',
      entidadeId: ministerio.id,
      antes: existing,
      depois: ministerio,
      req: request,
    });

    return NextResponse.json(ministerio);
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (err.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao atualizar ministério' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeExcluir = await hasPermission(user.id, 'ministerios', 'excluir');
    if (!podeExcluir) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.ministerio.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Ministério não encontrado' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);

    const ministerio = await prisma.ministerio.update({
      where: { id },
      data: { ativo: false },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'DELETE',
      entidade: 'Ministerio',
      entidadeId: id,
      antes: existing,
      depois: ministerio,
      req: request,
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (err.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao inativar ministério' }, { status: 500 });
  }
}
