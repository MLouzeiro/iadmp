import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');
    const tipo = searchParams.get('tipo');
    const ativo = searchParams.get('ativo');

    const where: Record<string, unknown> = {};
    if (organizacaoId) {
      const podeVer = await canManageOrganization(user.id, organizacaoId);
      if (!podeVer) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });
      where.organizacaoId = organizacaoId;
    }
    if (tipo) where.tipo = tipo;
    if (ativo !== null && ativo !== undefined && ativo !== '') where.ativo = ativo === 'true';

    if (!organizacaoId && user.role !== 'SUPER_ADMIN') {
      const vinculos = await prisma.usuarioOrganizacao.findMany({
        where: { userId: user.id },
        select: { organizacaoId: true },
      });
      where.organizacaoId = { in: vinculos.map(v => v.organizacaoId) };
    }

    const canais = await prisma.canalOficial.findMany({
      where,
      include: { organizacao: { select: { id: true, nome: true } } },
      orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ canais });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    console.error('GET /api/comunicacao/canais error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const hasPerm = await hasPermission(user.id, 'comunicacao', 'gerenciar_canais');
    if (!hasPerm) return NextResponse.json({ error: 'Sem permissao para gerenciar canais' }, { status: 403 });

    const body = await request.json();
    const { organizacaoId, tipo, nome, url, descricao, ativo, ordem } = body;

    if (!organizacaoId || !tipo || !nome || !url) {
      return NextResponse.json({ error: 'organizacaoId, tipo, nome e url sao obrigatorios' }, { status: 400 });
    }

    const canManage = await canManageOrganization(user.id, organizacaoId);
    if (!canManage) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });

    const tiposValidos = ['youtube', 'instagram', 'facebook', 'tiktok', 'whatsapp', 'site', 'telegram'];
    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json({ error: 'Tipo de canal invalido' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'URL invalida' }, { status: 400 });
    }

    if (url.startsWith('javascript:') || url.startsWith('data:')) {
      return NextResponse.json({ error: 'URL contem esquema nao permitido' }, { status: 400 });
    }

    const canal = await prisma.canalOficial.create({
      data: {
        organizacaoId,
        tipo,
        nome,
        url,
        descricao: descricao || null,
        ativo: ativo !== undefined ? ativo : true,
        ordem: ordem || 0,
        createdById: user.id,
        updatedById: user.id,
      },
      include: { organizacao: { select: { id: true, nome: true } } },
    });

    return NextResponse.json({ canal }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    console.error('POST /api/comunicacao/canais error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
