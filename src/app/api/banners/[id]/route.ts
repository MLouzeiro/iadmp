import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';
import { writeAudit } from '@/lib/audit';
import {
  assertOrgAccess,
  ORG_FORBIDDEN,
  orgForbiddenResponse,
} from '@/lib/tenant';
import { parseDataDateOnly } from '@/lib/datas';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) return NextResponse.json({ error: 'Banner não encontrado' }, { status: 404 });
    await assertOrgAccess(user.id, banner.organizacaoId, request);
    return NextResponse.json(banner);
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (err.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar banner' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeEditar = await hasPermission(user.id, 'banners', 'editar');
    if (!podeEditar) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Banner não encontrado' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.titulo !== undefined) data.titulo = body.titulo || null;
    if (body.imagemUrl !== undefined) data.imagemUrl = body.imagemUrl;
    if (body.tipo !== undefined) data.tipo = body.tipo;
    if (body.link !== undefined) data.link = body.link || null;
    if (body.ordem !== undefined) data.ordem = body.ordem;
    if (body.ativo !== undefined) data.ativo = body.ativo;
    if (body.dataInicio !== undefined) {
      data.dataInicio = body.dataInicio ? parseDataDateOnly(body.dataInicio) : null;
    }
    if (body.dataFim !== undefined) {
      data.dataFim = body.dataFim ? parseDataDateOnly(body.dataFim) : null;
    }

    const banner = await prisma.banner.update({ where: { id }, data });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'UPDATE',
      entidade: 'Banner',
      entidadeId: banner.id,
      antes: existing,
      depois: banner,
      req: request,
    });

    return NextResponse.json(banner);
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (err.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao atualizar banner' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeExcluir = await hasPermission(user.id, 'banners', 'excluir');
    if (!podeExcluir) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Banner não encontrado' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);

    await prisma.banner.delete({ where: { id } });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'DELETE',
      entidade: 'Banner',
      entidadeId: id,
      antes: existing,
      req: request,
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (err.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao excluir banner' }, { status: 500 });
  }
}
