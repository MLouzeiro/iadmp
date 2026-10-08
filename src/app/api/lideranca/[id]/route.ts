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
    const lider = await prisma.lideranca.findUnique({
      where: { id },
      include: {
        ministerio: true,
        membro: true,
        congregacao: { select: { id: true, nome: true } },
        organizacao: { select: { id: true, nome: true } },
      },
    });
    if (!lider) {
      return NextResponse.json({ error: 'Líder não encontrado' }, { status: 404 });
    }
    await assertOrgAccess(user.id, lider.organizacaoId, request);
    return NextResponse.json(lider);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar líder' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeEditar = await hasPermission(user.id, 'lideranca', 'editar');
    if (!podeEditar) return NextResponse.json({ error: 'Sem permissão para editar liderança' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.lideranca.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Líder não encontrado' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.nome !== undefined) data.nome = body.nome;
    if (body.cargo !== undefined) data.cargo = body.cargo;
    if (body.foto !== undefined) data.foto = body.foto;
    if (body.biografia !== undefined) data.biografia = body.biografia;
    if (body.ordemExibicao !== undefined) data.ordemExibicao = body.ordemExibicao;
    if (body.publico !== undefined) data.publico = body.publico;
    if (body.ativo !== undefined) data.ativo = body.ativo;
    if (body.dataInicio !== undefined) {
      data.dataInicio = body.dataInicio ? parseDataDateOnly(body.dataInicio) : null;
    }
    if (body.dataFim !== undefined) data.dataFim = body.dataFim ? parseDataDateOnly(body.dataFim) : null;
    if (body.membroId !== undefined) data.membroId = body.membroId || null;
    if (body.ministerioId !== undefined) data.ministerioId = body.ministerioId || null;
    if (body.congregacaoId !== undefined || body.congregacao !== undefined) {
      data.congregacaoId = await resolveCongregacaoId(existing.organizacaoId, {
        congregacaoId: body.congregacaoId,
        congregacao: body.congregacao,
      });
    }

    const lider = await prisma.lideranca.update({
      where: { id },
      data,
      include: { congregacao: { select: { id: true, nome: true } } },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'UPDATE',
      entidade: 'Lideranca',
      entidadeId: id,
      antes: existing,
      depois: lider,
      req: request,
    });

    return NextResponse.json(lider);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao atualizar líder' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeExcluir = await hasPermission(user.id, 'lideranca', 'excluir');
    if (!podeExcluir) return NextResponse.json({ error: 'Sem permissão para excluir liderança' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.lideranca.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Líder não encontrado' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);
    await prisma.lideranca.delete({ where: { id } });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'DELETE',
      entidade: 'Lideranca',
      entidadeId: id,
      antes: existing,
      req: request,
    });

    return NextResponse.json({ message: 'Líder excluído' });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao excluir líder' }, { status: 500 });
  }
}
