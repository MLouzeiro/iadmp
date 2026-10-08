import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, action } = await params;

    const existing = await prisma.pregacao.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Pregação não encontrada' }, { status: 404 });

    const canManage = await canManageOrganization(user.id, existing.organizacaoId);
    if (!canManage) return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });

    switch (action) {
      case 'publicar': {
        const hasPerm = await hasPermission(user.id, 'pregacoes', 'publicar');
        if (!hasPerm) return NextResponse.json({ error: 'Sem permissão para publicar' }, { status: 403 });

        const pregacao = await prisma.pregacao.update({
          where: { id },
          data: { status: 'PUBLICADA', updatedById: user.id },
        });
        return NextResponse.json({ pregacao });
      }

      case 'arquivar': {
        const hasPerm = await hasPermission(user.id, 'pregacoes', 'editar');
        if (!hasPerm) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

        const pregacao = await prisma.pregacao.update({
          where: { id },
          data: { status: 'ARQUIVADA', destaque: false, updatedById: user.id },
        });
        return NextResponse.json({ pregacao });
      }

      case 'destacar': {
        const hasPerm = await hasPermission(user.id, 'pregacoes', 'destacar');
        if (!hasPerm) return NextResponse.json({ error: 'Sem permissão para destacar' }, { status: 403 });

        await prisma.pregacao.updateMany({
          where: { organizacaoId: existing.organizacaoId, destaque: true },
          data: { destaque: false },
        });

        const pregacao = await prisma.pregacao.update({
          where: { id },
          data: { destaque: true, updatedById: user.id },
        });
        return NextResponse.json({ pregacao });
      }

      case 'remover-destaque': {
        const hasPerm = await hasPermission(user.id, 'pregacoes', 'destacar');
        if (!hasPerm) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

        const pregacao = await prisma.pregacao.update({
          where: { id },
          data: { destaque: false, updatedById: user.id },
        });
        return NextResponse.json({ pregacao });
      }

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('POST /api/comunicacao/pregacoes/[id]/[action] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
