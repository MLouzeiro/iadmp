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
    const aviso = await prisma.aviso.findUnique({
      where: { id },
      include: {
        congregacao: { select: { id: true, nome: true } },
        organizacao: { select: { id: true, nome: true } },
      },
    });
    if (!aviso) return NextResponse.json({ error: 'Aviso não encontrado' }, { status: 404 });
    await assertOrgAccess(user.id, aviso.organizacaoId, request);
    return NextResponse.json(aviso);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar aviso' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeEditar = await hasPermission(user.id, 'avisos', 'editar');
    if (!podeEditar) return NextResponse.json({ error: 'Sem permissão para editar avisos' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.aviso.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Aviso não encontrado' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.titulo !== undefined) data.titulo = body.titulo;
    if (body.descricao !== undefined) data.descricao = body.descricao;
    if (body.imagem !== undefined) data.imagem = body.imagem || null;
    if (body.categoria !== undefined) data.categoria = body.categoria || null;
    if (body.publicoAlvo !== undefined) data.publicoAlvo = body.publicoAlvo || null;
    if (body.urgencia !== undefined) data.urgencia = body.urgencia;
    if (body.situacaoAviso !== undefined) data.situacaoAviso = body.situacaoAviso;
    if (body.publicarSite !== undefined) data.publicarSite = Boolean(body.publicarSite);
    if (body.mostrarPainel !== undefined) data.mostrarPainel = Boolean(body.mostrarPainel);
    if (body.destaque !== undefined) data.destaque = Boolean(body.destaque);
    if (body.comecaEm !== undefined) data.comecaEm = body.comecaEm ? parseDataDateOnly(body.comecaEm) : new Date();
    if (body.terminaEm !== undefined) data.terminaEm = body.terminaEm ? parseDataDateOnly(body.terminaEm) : null;
    if (body.congregacaoId !== undefined || body.congregacao !== undefined) {
      data.congregacaoId = await resolveCongregacaoId(existing.organizacaoId, {
        congregacaoId: body.congregacaoId,
        congregacao: body.congregacao,
      });
    }

    const aviso = await prisma.aviso.update({
      where: { id },
      data,
      include: { congregacao: { select: { id: true, nome: true } } },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'UPDATE',
      entidade: 'Aviso',
      entidadeId: aviso.id,
      antes: existing,
      depois: aviso,
      req: request,
    });

    return NextResponse.json(aviso);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao atualizar aviso' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeExcluir = await hasPermission(user.id, 'avisos', 'excluir');
    if (!podeExcluir) return NextResponse.json({ error: 'Sem permissão para excluir avisos' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.aviso.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Aviso não encontrado' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);

    await prisma.aviso.delete({ where: { id } });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'DELETE',
      entidade: 'Aviso',
      entidadeId: id,
      antes: existing,
      req: request,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao excluir aviso' }, { status: 500 });
  }
}
