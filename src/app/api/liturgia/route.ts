import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');
    const status = searchParams.get('status');
    const busca = searchParams.get('busca');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (organizacaoId) {
      const podeVer = await canManageOrganization(user.id, organizacaoId);
      if (!podeVer) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });
      where.organizacaoId = organizacaoId;
    } else if (user.role !== 'SUPER_ADMIN') {
      const vinculos = await prisma.usuarioOrganizacao.findMany({
        where: { userId: user.id },
        select: { organizacaoId: true },
      });
      where.organizacaoId = { in: vinculos.map(v => v.organizacaoId) };
    }
    if (status) where.status = status;
    if (busca) {
      where.OR = [
        { tema: { contains: busca, mode: 'insensitive' } },
        { dirigente: { contains: busca, mode: 'insensitive' } },
        { pregador: { contains: busca, mode: 'insensitive' } },
      ];
    }
    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = new Date(dataInicio);
      if (dataFim) where.data.lte = new Date(dataFim);
    }

    const [liturgias, total] = await Promise.all([
      prisma.liturgia.findMany({
        where,
        include: { itens: { orderBy: { ordem: 'asc' } }, organizacao: { select: { id: true, nome: true } } },
        orderBy: { data: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.liturgia.count({ where }),
    ]);

    return NextResponse.json({ liturgias, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    console.error('GET /api/liturgia error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const hasPerm = await hasPermission(user.id, 'liturgia', 'criar');
    if (!hasPerm) return NextResponse.json({ error: 'Sem permissao para criar liturgias' }, { status: 403 });

    const body = await request.json();
    const { organizacaoId, congregacao, data, horarioInicio, horarioFimPrevisto, tipoCulto, tema, dirigente, pregador, responsavel, observacoes, modeloId, itens } = body;

    if (!organizacaoId || !data || !horarioInicio) {
      return NextResponse.json({ error: 'organizacaoId, data e horarioInicio sao obrigatorios' }, { status: 400 });
    }

    const podeCriar = await canManageOrganization(user.id, organizacaoId);
    if (!podeCriar) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });

    const liturgia = await prisma.liturgia.create({
      data: {
        organizacaoId,
        congregacao: congregacao || null,
        data: new Date(data),
        horarioInicio,
        horarioFimPrevisto: horarioFimPrevisto || null,
        tipoCulto: tipoCulto || 'Celebracao',
        tema: tema || null,
        dirigente: dirigente || null,
        dirigenteUserId: user.id,
        pregador: pregador || null,
        responsavel: responsavel || null,
        responsavelUserId: user.id,
        observacoes: observacoes || null,
        status: 'RASCUNHO',
        modeloId: modeloId || null,
        createdById: user.id,
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

    return NextResponse.json({ liturgia }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    console.error('POST /api/liturgia error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}