import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');
    const categoria = searchParams.get('categoria');
    const busca = searchParams.get('busca');

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
    if (categoria) where.categoria = categoria;
    if (busca) {
      where.OR = [
        { titulo: { contains: busca, mode: 'insensitive' } },
        { compositor: { contains: busca, mode: 'insensitive' } },
        { artista: { contains: busca, mode: 'insensitive' } },
      ];
    }

    const musicas = await prisma.liturgiaMusica.findMany({
      where,
      orderBy: { titulo: 'asc' },
    });

    return NextResponse.json({ musicas });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    console.error('GET /api/liturgia/musicas error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const hasPerm = await hasPermission(user.id, 'liturgia', 'gerenciar_musicas');
    if (!hasPerm) return NextResponse.json({ error: 'Sem permissao para gerenciar musicas' }, { status: 403 });

    const body = await request.json();
    const { organizacaoId, titulo, compositor, artista, tom, categoria, letra, link, observacoes } = body;

    if (!organizacaoId || !titulo) {
      return NextResponse.json({ error: 'organizacaoId e titulo sao obrigatorios' }, { status: 400 });
    }

    const podeCriar = await canManageOrganization(user.id, organizacaoId);
    if (!podeCriar) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });

    const musica = await prisma.liturgiaMusica.create({
      data: {
        organizacaoId,
        titulo,
        compositor: compositor || null,
        artista: artista || null,
        tom: tom || null,
        categoria: categoria || 'Adoracao',
        letra: letra || null,
        link: link || null,
        observacoes: observacoes || null,
      },
    });

    return NextResponse.json({ musica }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    console.error('POST /api/liturgia/musicas error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}