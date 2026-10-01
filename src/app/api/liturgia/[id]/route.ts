import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const liturgia = await prisma.liturgia.findUnique({
      where: { id },
      include: {
        itens: { orderBy: { ordem: 'asc' }, include: { musica: true } },
        organizacao: { select: { id: true, nome: true } },
      },
    });

    if (!liturgia) return NextResponse.json({ error: 'Liturgia nao encontrada' }, { status: 404 });

    const podeVer = await canManageOrganization(user.id, liturgia.organizacaoId);
    if (!podeVer) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });

    return NextResponse.json({ liturgia });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    console.error('GET /api/liturgia/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const hasPerm = await hasPermission(user.id, 'liturgia', 'editar');
    if (!hasPerm) return NextResponse.json({ error: 'Sem permissao para editar liturgias' }, { status: 403 });

    const body = await request.json();
    const { organizacaoId, congregacao, data, horarioInicio, horarioFimPrevisto, tipoCulto, tema, dirigente, pregador, responsavel, observacoes, itens } = body;

    const existing = await prisma.liturgia.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Liturgia nao encontrada' }, { status: 404 });

    const podeEditar = await canManageOrganization(user.id, existing.organizacaoId);
    if (!podeEditar) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });

    if (organizacaoId && organizacaoId !== existing.organizacaoId) {
      const podeMover = await canManageOrganization(user.id, organizacaoId);
      if (!podeMover) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });
    }

    const liturgia = await prisma.$transaction(async (tx) => {
      if (itens) {
        await tx.liturgiaItem.deleteMany({ where: { liturgiaId: id } });
      }

      return tx.liturgia.update({
        where: { id },
        data: {
          organizacaoId: organizacaoId || existing.organizacaoId,
          congregacao: congregacao !== undefined ? congregacao : existing.congregacao,
          data: data ? new Date(data) : existing.data,
          horarioInicio: horarioInicio || existing.horarioInicio,
          horarioFimPrevisto: horarioFimPrevisto !== undefined ? horarioFimPrevisto : existing.horarioFimPrevisto,
          tipoCulto: tipoCulto || existing.tipoCulto,
          tema: tema !== undefined ? tema : existing.tema,
          dirigente: dirigente !== undefined ? dirigente : existing.dirigente,
          pregador: pregador !== undefined ? pregador : existing.pregador,
          responsavel: responsavel !== undefined ? responsavel : existing.responsavel,
          observacoes: observacoes !== undefined ? observacoes : existing.observacoes,
          updatedById: user.id,
          itens: itens ? {
            create: itens.map((item: any, idx: number) => ({
              ordem: item.ordem || idx + 1,
              tipo: item.tipo,
              titulo: item.titulo,
              horarioPrevisto: item.horarioPrevisto || null,
              duracaoPrevista: item.duracaoPrevista || null,
              responsavel: item.responsavel || null,
              descricao: item.descricao || null,
              observacoes: item.observacoes || null,
              musicaId: item.musicaId || null,
              referenciaBiblica: item.referenciaBiblica || null,
              livroBiblico: item.livroBiblico || null,
              capituloBiblico: item.capituloBiblico || null,
              versiculoInicio: item.versiculoInicio || null,
              versiculoFim: item.versiculoFim || null,
              textoBiblico: item.textoBiblico || null,
              temaPregacao: item.temaPregacao || null,
              prioridade: item.prioridade || 'NORMAL',
            })),
          } : undefined,
        },
        include: { itens: { orderBy: { ordem: 'asc' } }, organizacao: { select: { id: true, nome: true } } },
      });
    });

    return NextResponse.json({ liturgia });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    console.error('PUT /api/liturgia/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const hasPerm = await hasPermission(user.id, 'liturgia', 'excluir');
    if (!hasPerm) return NextResponse.json({ error: 'Sem permissao para excluir liturgias' }, { status: 403 });

    const existing = await prisma.liturgia.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Liturgia nao encontrada' }, { status: 404 });

    const podeExcluir = await canManageOrganization(user.id, existing.organizacaoId);
    if (!podeExcluir) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });

    await prisma.liturgia.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    console.error('DELETE /api/liturgia/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}