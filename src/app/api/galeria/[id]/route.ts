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
    const item = await prisma.galeriaItem.findUnique({
      where: { id },
      include: {
        album: { select: { id: true, nome: true } },
        evento: { select: { id: true, nome: true } },
      },
    });
    if (!item) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    await assertOrgAccess(user.id, item.organizacaoId, request);
    return NextResponse.json(item);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar item' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeEditar = await hasPermission(user.id, 'galeria', 'editar');
    if (!podeEditar) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.galeriaItem.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.titulo !== undefined) data.titulo = body.titulo || null;
    if (body.descricao !== undefined) data.descricao = body.descricao || null;
    if (body.url !== undefined) data.url = body.url;
    if (body.classArquivo !== undefined) data.classArquivo = body.classArquivo;
    if (body.ordem !== undefined) data.ordem = body.ordem;
    if (body.albumId !== undefined) data.albumId = body.albumId || null;
    if (body.eventoId !== undefined) data.eventoId = body.eventoId || null;

    const item = await prisma.galeriaItem.update({
      where: { id },
      data,
      include: { album: { select: { id: true, nome: true } } },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'UPDATE',
      entidade: 'GaleriaItem',
      entidadeId: item.id,
      antes: existing,
      depois: item,
      req: request,
    });

    return NextResponse.json(item);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao atualizar item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeExcluir = await hasPermission(user.id, 'galeria', 'excluir');
    if (!podeExcluir) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.galeriaItem.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);

    await prisma.galeriaItem.delete({ where: { id } });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'DELETE',
      entidade: 'GaleriaItem',
      entidadeId: id,
      antes: existing,
      req: request,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao excluir item' }, { status: 500 });
  }
}
