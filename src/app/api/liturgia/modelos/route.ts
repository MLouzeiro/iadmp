import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');

    const where: any = { ativo: true };
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

    const modelos = await prisma.liturgiaModelo.findMany({
      where,
      include: { momentos: { orderBy: { ordem: 'asc' } } },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json({ modelos });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    console.error('GET /api/liturgia/modelos error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const hasPerm = await hasPermission(user.id, 'liturgia', 'gerenciar_modelos');
    if (!hasPerm) return NextResponse.json({ error: 'Sem permissao para gerenciar modelos' }, { status: 403 });

    const body = await request.json();
    const { organizacaoId, nome, descricao, tipoCulto, momentos } = body;

    if (!organizacaoId || !nome) {
      return NextResponse.json({ error: 'organizacaoId e nome sao obrigatorios' }, { status: 400 });
    }

    const podeCriar = await canManageOrganization(user.id, organizacaoId);
    if (!podeCriar) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });

    const modelo = await prisma.liturgiaModelo.create({
      data: {
        organizacaoId,
        nome,
        descricao: descricao || null,
        tipoCulto: tipoCulto || null,
        createdById: user.id,
        momentos: momentos ? {
          create: momentos.map((m: any, idx: number) => ({
            ordem: m.ordem || idx + 1,
            tipo: m.tipo,
            titulo: m.titulo,
            duracaoPrevista: m.duracaoPrevista || null,
            descricao: m.descricao || null,
            observacoes: m.observacoes || null,
            musicaId: m.musicaId || null,
            referenciaBiblica: m.referenciaBiblica || null,
          })),
        } : undefined,
      },
      include: { momentos: { orderBy: { ordem: 'asc' } } },
    });

    return NextResponse.json({ modelo }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    console.error('POST /api/liturgia/modelos error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}