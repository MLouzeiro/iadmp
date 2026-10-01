import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const canal = await prisma.canalOficial.findUnique({
      where: { id },
      include: { organizacao: { select: { id: true, nome: true } } },
    });

    if (!canal) return NextResponse.json({ error: 'Canal nao encontrado' }, { status: 404 });

    const podeVer = await canManageOrganization(user.id, canal.organizacaoId);
    if (!podeVer) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });

    return NextResponse.json({ canal });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    console.error('GET /api/comunicacao/canais/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const hasPerm = await hasPermission(user.id, 'comunicacao', 'gerenciar_canais');
    if (!hasPerm) return NextResponse.json({ error: 'Sem permissao para gerenciar canais' }, { status: 403 });

    const existing = await prisma.canalOficial.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Canal nao encontrado' }, { status: 404 });

    const canManage = await canManageOrganization(user.id, existing.organizacaoId);
    if (!canManage) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });

    const body = await request.json();
    const { tipo, nome, url, descricao, ativo, ordem } = body;

    if (url) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json({ error: 'URL invalida' }, { status: 400 });
      }
      if (url.startsWith('javascript:') || url.startsWith('data:')) {
        return NextResponse.json({ error: 'URL contem esquema nao permitido' }, { status: 400 });
      }
    }

    if (tipo) {
      const tiposValidos = ['youtube', 'instagram', 'facebook', 'tiktok', 'whatsapp', 'site', 'telegram'];
      if (!tiposValidos.includes(tipo)) {
        return NextResponse.json({ error: 'Tipo de canal invalido' }, { status: 400 });
      }
    }

    const canal = await prisma.canalOficial.update({
      where: { id },
      data: {
        tipo: tipo || existing.tipo,
        nome: nome || existing.nome,
        url: url || existing.url,
        descricao: descricao !== undefined ? descricao : existing.descricao,
        ativo: ativo !== undefined ? ativo : existing.ativo,
        ordem: ordem !== undefined ? ordem : existing.ordem,
        updatedById: user.id,
      },
      include: { organizacao: { select: { id: true, nome: true } } },
    });

    return NextResponse.json({ canal });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    console.error('PUT /api/comunicacao/canais/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const hasPerm = await hasPermission(user.id, 'comunicacao', 'excluir');
    if (!hasPerm) return NextResponse.json({ error: 'Sem permissao para excluir canais' }, { status: 403 });

    const existing = await prisma.canalOficial.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Canal nao encontrado' }, { status: 404 });

    const canManage = await canManageOrganization(user.id, existing.organizacaoId);
    if (!canManage) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });

    await prisma.canalOficial.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    console.error('DELETE /api/comunicacao/canais/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
