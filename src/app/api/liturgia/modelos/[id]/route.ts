import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const modelo = await prisma.liturgiaModelo.findUnique({
      where: { id },
      include: { momentos: { orderBy: { ordem: 'asc' } } },
    });

    if (!modelo) return NextResponse.json({ error: 'Modelo nao encontrado' }, { status: 404 });

    const podeVer = await canManageOrganization(user.id, modelo.organizacaoId);
    if (!podeVer) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });

    return NextResponse.json({ modelo });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    console.error('GET /api/liturgia/modelos/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const hasPerm = await hasPermission(user.id, 'liturgia', 'gerenciar_modelos');
    if (!hasPerm) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });

    const existing = await prisma.liturgiaModelo.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Modelo nao encontrado' }, { status: 404 });

    const podeEditar = await canManageOrganization(user.id, existing.organizacaoId);
    if (!podeEditar) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });

    const body = await request.json();
    const { nome, descricao, tipoCulto, momentos } = body;

    const modelo = await prisma.$transaction(async (tx) => {
      if (momentos) {
        await tx.liturgiaModeloMomento.deleteMany({ where: { modeloId: id } });
      }

      return tx.liturgiaModelo.update({
        where: { id },
        data: {
          nome,
          descricao,
          tipoCulto,
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
    });

    return NextResponse.json({ modelo });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    console.error('PUT /api/liturgia/modelos/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const hasPerm = await hasPermission(user.id, 'liturgia', 'gerenciar_modelos');
    if (!hasPerm) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });

    const existing = await prisma.liturgiaModelo.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Modelo nao encontrado' }, { status: 404 });

    const podeExcluir = await canManageOrganization(user.id, existing.organizacaoId);
    if (!podeExcluir) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });

    await prisma.liturgiaModelo.update({ where: { id }, data: { ativo: false } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    console.error('DELETE /api/liturgia/modelos/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}