import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { avisoSchema } from '@/lib/validations';
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
    const validated = avisoSchema.partial().parse(body);
    const data: Record<string, unknown> = {};
    if (validated.titulo !== undefined) data.titulo = validated.titulo;
    if (validated.descricao !== undefined) data.descricao = validated.descricao;
    if (validated.imagem !== undefined) data.imagem = validated.imagem || null;
    if (validated.categoria !== undefined) data.categoria = validated.categoria || null;
    if (validated.publicoAlvo !== undefined) data.publicoAlvo = validated.publicoAlvo || null;
    if (validated.urgencia !== undefined) data.urgencia = validated.urgencia;
    if (validated.situacaoAviso !== undefined) data.situacaoAviso = validated.situacaoAviso;
    if (validated.publicarSite !== undefined) data.publicarSite = Boolean(validated.publicarSite);
    if (validated.mostrarPainel !== undefined) data.mostrarPainel = Boolean(validated.mostrarPainel);
    if (validated.destaque !== undefined) data.destaque = Boolean(validated.destaque);
    if (validated.dataInicio !== undefined) data.comecaEm = validated.dataInicio ? parseDataDateOnly(validated.dataInicio) : new Date();
    if (validated.dataFim !== undefined) data.terminaEm = validated.dataFim ? parseDataDateOnly(validated.dataFim) : null;
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
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
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
