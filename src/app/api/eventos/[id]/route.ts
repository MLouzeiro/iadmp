import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';
import { writeAudit } from '@/lib/audit';
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
    const evento = await prisma.evento.findUnique({
      where: { id },
      include: {
        categoria: true,
        campanha: true,
        avaliacao: true,
        participantes: true,
        financeiro: true,
        tarefas: true,
        congregacao: { select: { id: true, nome: true } },
        organizacao: { select: { id: true, nome: true } },
      },
    });
    if (!evento) {
      return NextResponse.json({ error: 'Evento nao encontrado' }, { status: 404 });
    }
    await assertOrgAccess(user.id, evento.organizacaoId, request);
    return NextResponse.json(evento);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar evento' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeEditar = await hasPermission(user.id, 'eventos', 'editar');
    if (!podeEditar) return NextResponse.json({ error: 'Sem permissao para editar eventos' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.evento.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Evento nao encontrado' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.nome !== undefined) data.nome = body.nome;
    if (body.categoriaId !== undefined) data.categoriaId = body.categoriaId || null;
    if (body.dataInicio !== undefined) data.dataInicio = new Date(body.dataInicio);
    if (body.dataEvento !== undefined) data.dataEvento = new Date(body.dataEvento);
    if (body.dataFim !== undefined) data.dataFim = body.dataFim ? new Date(body.dataFim) : null;
    if (body.tema !== undefined) data.tema = body.tema;
    if (body.preletores !== undefined) data.preletores = body.preletores;
    if (body.diasDuracao !== undefined) data.diasDuracao = body.diasDuracao;
    if (body.status !== undefined) data.status = body.status;
    if (body.observacoes !== undefined) data.observacoes = body.observacoes;
    if (body.local !== undefined) data.local = body.local;
    if (body.responsavelGeral !== undefined) data.responsavelGeral = body.responsavelGeral;
    if (body.publicarNoSite !== undefined) data.publicarNoSite = body.publicarNoSite;
    if (body.orcamentoPrevisto !== undefined) data.orcamentoPrevisto = body.orcamentoPrevisto;
    if (body.congregacaoId !== undefined || body.congregacao !== undefined) {
      data.congregacaoId = await resolveCongregacaoId(existing.organizacaoId, {
        congregacaoId: body.congregacaoId,
        congregacao: body.congregacao,
      });
    }

    const evento = await prisma.evento.update({
      where: { id },
      data,
      include: { categoria: true, congregacao: { select: { id: true, nome: true } } },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'UPDATE',
      entidade: 'Evento',
      entidadeId: id,
      antes: existing,
      depois: evento,
      req: request,
    });

    return NextResponse.json(evento);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao atualizar evento' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeExcluir = await hasPermission(user.id, 'eventos', 'excluir');
    if (!podeExcluir) return NextResponse.json({ error: 'Sem permissao para excluir eventos' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.evento.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Evento nao encontrado' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);
    await prisma.evento.delete({ where: { id } });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'DELETE',
      entidade: 'Evento',
      entidadeId: id,
      antes: existing,
      req: request,
    });

    return NextResponse.json({ message: 'Evento excluido' });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao excluir evento' }, { status: 500 });
  }
}
