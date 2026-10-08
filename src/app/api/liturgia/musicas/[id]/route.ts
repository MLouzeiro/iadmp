import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const musica = await prisma.liturgiaMusica.findUnique({ where: { id } });
    if (!musica) return NextResponse.json({ error: 'Música não encontrada' }, { status: 404 });

    const podeVer = await canManageOrganization(user.id, musica.organizacaoId);
    if (!podeVer) return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });

    return NextResponse.json({ musica });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    console.error('GET /api/liturgia/musicas/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const hasPerm = await hasPermission(user.id, 'liturgia', 'gerenciar_musicas');
    if (!hasPerm) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const existing = await prisma.liturgiaMusica.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Música não encontrada' }, { status: 404 });

    const podeEditar = await canManageOrganization(user.id, existing.organizacaoId);
    if (!podeEditar) return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });

    const body = await request.json();
    const musica = await prisma.liturgiaMusica.update({
      where: { id },
      data: {
        titulo: body.titulo,
        compositor: body.compositor,
        artista: body.artista,
        tom: body.tom,
        categoria: body.categoria,
        letra: body.letra,
        link: body.link,
        observacoes: body.observacoes,
      },
    });

    return NextResponse.json({ musica });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('PUT /api/liturgia/musicas/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const hasPerm = await hasPermission(user.id, 'liturgia', 'gerenciar_musicas');
    if (!hasPerm) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const existing = await prisma.liturgiaMusica.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Música não encontrada' }, { status: 404 });

    const podeExcluir = await canManageOrganization(user.id, existing.organizacaoId);
    if (!podeExcluir) return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });

    await prisma.liturgiaMusica.update({ where: { id }, data: { ativo: false } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('DELETE /api/liturgia/musicas/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}