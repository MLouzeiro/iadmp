import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireSuperAdmin } from '@/lib/auth-helpers';
import { writeAudit } from '@/lib/audit';

const atualizarPublicacaoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').optional(),
  conteudo: z.string().min(1, 'Conteúdo é obrigatório').optional(),
  tipo: z.string().optional(),
  status: z.enum(['RASCUNHO', 'PUBLICADA', 'ARQUIVADA']).optional(),
  organizacoesIds: z.array(z.string()).optional(),
});

const acaoDestinoSchema = z.object({
  acao: z.enum(['publicar', 'despublicar', 'arquivar']),
  organizacaoId: z.string().min(1, 'organacaoId é obrigatório'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const publicacao = await prisma.publicacao.findUnique({
      where: { id },
      include: {
        autor: { select: { id: true, name: true, email: true } },
        publicadoPor: { select: { id: true, name: true, email: true } },
        destinos: {
          include: {
            organizacao: { select: { id: true, nome: true, slug: true } },
            publicadoPor: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!publicacao) {
      return NextResponse.json({ error: 'Publicação não encontrada' }, { status: 404 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      const userOrgs = await prisma.usuarioOrganizacao.findMany({
        where: { userId: user.id },
        select: { organizacaoId: true },
      });
      const orgIds = userOrgs.map(u => u.organizacaoId);
      const hasAccess = publicacao.destinos.some(d => orgIds.includes(d.organizacaoId));
      if (!hasAccess) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(publicacao);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    return NextResponse.json({ error: 'Erro ao buscar publicação' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();

    const { id } = await params;
    const body = await request.json();
    const validated = atualizarPublicacaoSchema.parse(body);

    const existing = await prisma.publicacao.findUnique({
      where: { id },
      include: { destinos: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Publicação não encontrada' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (validated.titulo !== undefined) data.titulo = validated.titulo;
    if (validated.conteudo !== undefined) data.conteudo = validated.conteudo;
    if (validated.tipo !== undefined) data.tipo = validated.tipo;
    if (validated.status !== undefined) {
      data.status = validated.status;
      if (validated.status === 'PUBLICADA' && existing.status !== 'PUBLICADA') {
        data.publicadoEm = new Date();
        data.publicadoPorId = (await requireAuth()).id;
      }
    }

    const publicacao = await prisma.publicacao.update({
      where: { id },
      data,
      include: {
        destinos: { include: { organizacao: { select: { id: true, nome: true } } } },
      },
    });

    if (validated.organizacoesIds) {
      const currentOrgIds = existing.destinos.map(d => d.organizacaoId);
      const toAdd = validated.organizacoesIds.filter(o => !currentOrgIds.includes(o));
      const toRemove = currentOrgIds.filter(o => !validated.organizacoesIds.includes(o));

      await prisma.$transaction(async (tx) => {
        for (const orgId of toAdd) {
          await tx.publicacaoOrganizacao.create({
            data: { publicacaoId: id, organizacaoId: orgId, status: 'PENDENTE' },
          });
        }
        if (toRemove.length > 0) {
          await tx.publicacaoOrganizacao.deleteMany({
            where: { publicacaoId: id, organizacaoId: { in: toRemove } },
          });
        }
      });
    }

    await writeAudit({
      userId: (await requireAuth()).id,
      acao: 'ATUALIZAR_PUBLICACAO',
      entidade: 'Publicacao',
      entidadeId: id,
      antes: { titulo: existing.titulo, status: existing.status },
      depois: { titulo: publicacao.titulo, status: publicacao.status },
      req: request,
    });

    return NextResponse.json(publicacao);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    if (error instanceof z.ZodError) {
      const msg = error.issues.map(i => i.message).join('; ');
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao atualizar publicação' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();

    const { id } = await params;

    const existing = await prisma.publicacao.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Publicação não encontrada' }, { status: 404 });
    }

    await prisma.publicacao.delete({ where: { id } });

    await writeAudit({
      userId: (await requireAuth()).id,
      acao: 'EXCLUIR_PUBLICACAO',
      entidade: 'Publicacao',
      entidadeId: id,
      antes: { titulo: existing.titulo },
      req: request,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    return NextResponse.json({ error: 'Erro ao excluir publicação' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();

    const { id } = await params;
    const body = await request.json();
    const validated = acaoDestinoSchema.parse(body);

    const publicacao = await prisma.publicacao.findUnique({
      where: { id },
      include: { destinos: true },
    });

    if (!publicacao) {
      return NextResponse.json({ error: 'Publicação não encontrada' }, { status: 404 });
    }

    const destino = publicacao.destinos.find(d => d.organizacaoId === validated.organizacaoId);
    if (!destino) {
      return NextResponse.json({ error: 'Destino não encontrado para esta organização' }, { status: 404 });
    }

    let novoStatusDestino: string;
    let novaStatusPublicacao = publicacao.status;
    const agora = new Date();
    const userId = (await requireAuth()).id;

    if (validated.acao === 'publicar') {
      novoStatusDestino = 'PUBLICADO';
      if (publicacao.status !== 'PUBLICADA') {
        novaStatusPublicacao = 'PUBLICADA';
      }
    } else if (validated.acao === 'despublicar') {
      novoStatusDestino = 'DESPUBLICADO';
      const outrosPublicados = publicacao.destinos.filter(d => d.status === 'PUBLICADO' && d.organizacaoId !== validated.organizacaoId);
      if (outrosPublicados.length === 0) {
        novaStatusPublicacao = 'RASCUNHO';
      }
    } else if (validated.acao === 'arquivar') {
      novoStatusDestino = 'ARQUIVADO';
      const outrosAtivos = publicacao.destinos.filter(d => ['PENDENTE', 'PUBLICADO'].includes(d.status) && d.organizacaoId !== validated.organizacaoId);
      if (outrosAtivos.length === 0) {
        novaStatusPublicacao = 'ARQUIVADA';
      }
    } else {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.publicacaoOrganizacao.update({
        where: { publicacaoId_organizacaoId: { publicacaoId: id, organizacaoId: validated.organizacaoId } },
        data: {
          status: novoStatusDestino,
          publicadoEm: validated.acao === 'publicar' ? agora : destino.publicadoEm,
          publicadoPorId: validated.acao === 'publicar' ? userId : destino.publicadoPorId,
        },
      });

      if (novaStatusPublicacao !== publicacao.status) {
        await tx.publicacao.update({
          where: { id },
          data: {
            status: novaStatusPublicacao,
            publicadoEm: novaStatusPublicacao === 'PUBLICADA' && publicacao.status !== 'PUBLICADA' ? agora : publicacao.publicadoEm,
            publicadoPorId: novaStatusPublicacao === 'PUBLICADA' && publicacao.status !== 'PUBLICADA' ? userId : publicacao.publicadoPorId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          organizacaoId: validated.organizacaoId,
          acao: `PUBLICACAO_${validated.acao.toUpperCase()}`,
          entidade: 'PublicacaoOrganizacao',
          entidadeId: destino.id,
          antes: { status: destino.status },
          depois: { status: novoStatusDestino },
          req: request,
        },
      });
    });

    return NextResponse.json({ ok: true, statusDestino: novoStatusDestino, statusPublicacao: novaStatusPublicacao });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    if (error instanceof z.ZodError) {
      const msg = error.issues.map(i => i.message).join('; ');
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao executar ação na publicação' }, { status: 500 });
  }
}