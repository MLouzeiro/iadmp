import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const pregacao = await prisma.pregacao.findUnique({
      where: { id },
      include: {
        organizacao: { select: { id: true, nome: true } },
        liturgia: {
          select: {
            id: true, tema: true, data: true, horarioInicio: true, horarioFimPrevisto: true,
            tipoCulto: true, dirigente: true, pregador: true, status: true, congregacaoId: true,
            congregacao: { select: { id: true, nome: true } },
          },
        },
        pregador: { select: { id: true, name: true, email: true } },
      },
    });

    if (!pregacao) return NextResponse.json({ error: 'Pregação não encontrada' }, { status: 404 });

    const podeVer = await canManageOrganization(user.id, pregacao.organizacaoId);
    if (!podeVer) return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });

    return NextResponse.json({ pregacao });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    console.error('GET /api/comunicacao/pregacoes/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const hasPerm = await hasPermission(user.id, 'pregacoes', 'editar');
    if (!hasPerm) return NextResponse.json({ error: 'Sem permissão para editar pregações' }, { status: 403 });

    const existing = await prisma.pregacao.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Pregação não encontrada' }, { status: 404 });

    const canManage = await canManageOrganization(user.id, existing.organizacaoId);
    if (!canManage) return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });

    const body = await request.json();
    const {
      liturgiaId, titulo, descricao, tema, tipo, pregadorId, pregadorNome,
      data, referenciaLivro, referenciaCapitulo, referenciaVersIni, referenciaVersFim,
      videoUrl, capaUrl, observacoes, status, destaque
    } = body;

    if (videoUrl) {
      try { new URL(videoUrl); } catch {
        return NextResponse.json({ error: 'URL do video inválida' }, { status: 400 });
      }
      if (videoUrl.startsWith('javascript:') || videoUrl.startsWith('data:')) {
        return NextResponse.json({ error: 'URL contém esquema não permitido' }, { status: 400 });
      }
    }

    if (liturgiaId && liturgiaId !== existing.liturgiaId) {
      const liturgia = await prisma.liturgia.findUnique({ where: { id: liturgiaId } });
      if (!liturgia) return NextResponse.json({ error: 'Liturgia não encontrada' }, { status: 404 });
      if (liturgia.organizacaoId !== existing.organizacaoId) {
        return NextResponse.json({ error: 'Liturgia pertence a outra organização' }, { status: 403 });
      }
      const existingPregacao = await prisma.pregacao.findUnique({ where: { liturgiaId } });
      if (existingPregacao && existingPregacao.id !== id) {
        return NextResponse.json({ error: 'Esta liturgia já possui uma pregação vinculada' }, { status: 400 });
      }
    }

    const pregacao = await prisma.pregacao.update({
      where: { id },
      data: {
        liturgiaId: liturgiaId !== undefined ? liturgiaId || null : existing.liturgiaId,
        titulo: titulo || existing.titulo,
        descricao: descricao !== undefined ? descricao : existing.descricao,
        tema: tema !== undefined ? tema : existing.tema,
        tipo: tipo || existing.tipo,
        pregadorId: pregadorId !== undefined ? pregadorId || null : existing.pregadorId,
        pregadorNome: pregadorNome !== undefined ? pregadorNome : existing.pregadorNome,
        data: data ? new Date(data) : existing.data,
        referenciaLivro: referenciaLivro !== undefined ? referenciaLivro : existing.referenciaLivro,
        referenciaCapitulo: referenciaCapitulo !== undefined ? referenciaCapitulo : existing.referenciaCapitulo,
        referenciaVersIni: referenciaVersIni !== undefined ? referenciaVersIni : existing.referenciaVersIni,
        referenciaVersFim: referenciaVersFim !== undefined ? referenciaVersFim : existing.referenciaVersFim,
        videoUrl: videoUrl !== undefined ? videoUrl : existing.videoUrl,
        capaUrl: capaUrl !== undefined ? capaUrl : existing.capaUrl,
        observacoes: observacoes !== undefined ? observacoes : existing.observacoes,
        status: status || existing.status,
        destaque: destaque !== undefined ? destaque : existing.destaque,
        updatedById: user.id,
      },
      include: {
        organizacao: { select: { id: true, nome: true } },
        liturgia: { select: { id: true, tema: true, data: true, horarioInicio: true, tipoCulto: true } },
        pregador: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ pregacao });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('PUT /api/comunicacao/pregacoes/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const hasPerm = await hasPermission(user.id, 'pregacoes', 'excluir');
    if (!hasPerm) return NextResponse.json({ error: 'Sem permissão para excluir pregações' }, { status: 403 });

    const existing = await prisma.pregacao.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Pregação não encontrada' }, { status: 404 });

    const canManage = await canManageOrganization(user.id, existing.organizacaoId);
    if (!canManage) return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });

    await prisma.pregacao.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('DELETE /api/comunicacao/pregacoes/[id] error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
