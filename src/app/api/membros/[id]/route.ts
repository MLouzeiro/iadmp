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
    const membro = await prisma.membro.findUnique({
      where: { id },
      include: {
        ministerio: true,
        departamento: true,
        lideranca: true,
        congregacao: { select: { id: true, nome: true } },
        organizacao: { select: { id: true, nome: true } },
      },
    });
    if (!membro) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }
    await assertOrgAccess(user.id, membro.organizacaoId, request);
    return NextResponse.json(membro);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar membro' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeEditar = await hasPermission(user.id, 'membros', 'editar');
    if (!podeEditar) return NextResponse.json({ error: 'Sem permissão para editar membros' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.membro.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.nome !== undefined) data.nome = body.nome;
    if (body.email !== undefined) data.email = body.email;
    if (body.telefone !== undefined) data.telefone = body.telefone;
    if (body.whatsapp !== undefined) data.whatsapp = body.whatsapp;
    if (body.dataNascimento !== undefined) {
      data.dataNascimento = body.dataNascimento ? parseDataDateOnly(body.dataNascimento) : null;
    }
    if (body.endereco !== undefined) data.endereco = body.endereco;
    if (body.status !== undefined) data.status = body.status;
    if (body.observacoes !== undefined) data.observacoes = body.observacoes;
    if (body.ministerioId !== undefined) data.ministerioId = body.ministerioId || null;
    if (body.departamentoId !== undefined) data.departamentoId = body.departamentoId || null;
    if (body.congregacaoId !== undefined || body.congregacao !== undefined) {
      data.congregacaoId = await resolveCongregacaoId(existing.organizacaoId, {
        congregacaoId: body.congregacaoId,
        congregacao: body.congregacao,
      });
    }

    const membro = await prisma.membro.update({
      where: { id },
      data,
      include: { congregacao: { select: { id: true, nome: true } } },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'UPDATE',
      entidade: 'Membro',
      entidadeId: id,
      antes: existing,
      depois: membro,
      req: request,
    });

    return NextResponse.json(membro);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao atualizar membro' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeExcluir = await hasPermission(user.id, 'membros', 'excluir');
    if (!podeExcluir) return NextResponse.json({ error: 'Sem permissão para excluir membros' }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.membro.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });

    await assertOrgAccess(user.id, existing.organizacaoId, request);
    await prisma.membro.delete({ where: { id } });

    await writeAudit({
      userId: user.id,
      organizacaoId: existing.organizacaoId,
      acao: 'DELETE',
      entidade: 'Membro',
      entidadeId: id,
      antes: existing,
      req: request,
    });

    return NextResponse.json({ message: 'Membro excluído' });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao excluir membro' }, { status: 500 });
  }
}
