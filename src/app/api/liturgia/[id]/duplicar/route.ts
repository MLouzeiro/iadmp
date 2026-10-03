import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const hasPerm = await hasPermission(user.id, 'liturgia', 'criar');
    if (!hasPerm) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });

    const existing = await prisma.liturgia.findUnique({
      where: { id },
      include: { itens: { orderBy: { ordem: 'asc' } } },
    });
    if (!existing) return NextResponse.json({ error: 'Liturgia original nao encontrada' }, { status: 404 });

    const podeDuplicar = await canManageOrganization(user.id, existing.organizacaoId);
    if (!podeDuplicar) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const novaData = body.data || new Date().toISOString();
    const novoTema = body.tema || `${existing.tema} (Copia)`;

    const liturgia = await prisma.liturgia.create({
      data: {
        organizacaoId: existing.organizacaoId,
        congregacaoId: existing.congregacaoId,
        data: new Date(novaData),
        horarioInicio: existing.horarioInicio,
        horarioFimPrevisto: existing.horarioFimPrevisto,
        tipoCulto: existing.tipoCulto,
        tema: novoTema,
        dirigente: existing.dirigente,
        pregador: existing.pregador,
        responsavel: existing.responsavel,
        observacoes: existing.observacoes,
        status: 'RASCUNHO',
        modeloId: existing.modeloId,
        createdById: user.id,
        updatedById: user.id,
        itens: {
          create: existing.itens.map((item) => ({
            ordem: item.ordem,
            tipo: item.tipo,
            titulo: item.titulo,
            horarioPrevisto: item.horarioPrevisto,
            duracaoPrevista: item.duracaoPrevista,
            responsavel: item.responsavel,
            descricao: item.descricao,
            observacoes: item.observacoes,
            musicaId: item.musicaId,
            referenciaBiblica: item.referenciaBiblica,
            livroBiblico: item.livroBiblico,
            capituloBiblico: item.capituloBiblico,
            versiculoInicio: item.versiculoInicio,
            versiculoFim: item.versiculoFim,
            textoBiblico: item.textoBiblico,
            temaPregacao: item.temaPregacao,
            prioridade: item.prioridade,
          })),
        },
      },
      include: { itens: { orderBy: { ordem: 'asc' } }, organizacao: { select: { id: true, nome: true } } },
    });

    return NextResponse.json({ liturgia }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    console.error('POST /api/liturgia/[id]/duplicar error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}