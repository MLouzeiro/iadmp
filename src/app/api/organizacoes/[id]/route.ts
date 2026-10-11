import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireSuperAdmin, canManageOrganization } from '@/lib/auth-helpers';
import { writeAudit } from '@/lib/audit';

function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const atualizarOrganizacaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  descricao: z.string().nullable().optional(),
  slug: z.string().optional(),
  dominioPersonalizado: z.string().nullable().optional(),
  ativo: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (user.role !== 'SUPER_ADMIN') {
      const allowed = await canManageOrganization(user.id, id);
      if (!allowed) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const organizacao = await prisma.organizacao.findUnique({
      where: { id },
      include: {
        configuracoes: true,
        paginaPublica: true,
        _count: {
          select: {
            usuarios: true,
            membros: true,
            liderancas: true,
            eventos: true,
            congregacoes: true,
          },
        },
      },
    });

    if (!organizacao) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    return NextResponse.json(organizacao);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Erro ao buscar organização' }, { status: 500 });
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
    const validated = atualizarOrganizacaoSchema.parse(body);

    const existing = await prisma.organizacao.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    let slug = validated.slug;
    if (slug && slug !== existing.slug) {
      let counter = 1;
      const baseSlug = slug;
      while (await prisma.organizacao.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter++}`;
      }
    }

    const data: Record<string, unknown> = {};
    if (validated.nome !== undefined) data.nome = validated.nome;
    if (validated.descricao !== undefined) data.descricao = validated.descricao;
    if (slug !== undefined) data.slug = slug;
    if (validated.dominioPersonalizado !== undefined) data.dominioPersonalizado = validated.dominioPersonalizado;
    if (validated.ativo !== undefined) data.ativo = validated.ativo;

    const organizacao = await prisma.organizacao.update({
      where: { id },
      data,
    });

    await writeAudit({
      userId: (await requireAuth()).id,
      organizacaoId: id,
      acao: 'ATUALIZAR_ORGANIZACAO',
      entidade: 'Organizacao',
      entidadeId: id,
      antes: { nome: existing.nome, slug: existing.slug, ativo: existing.ativo },
      depois: { nome: organizacao.nome, slug: organizacao.slug, ativo: organizacao.ativo },
      req: request,
    });

    return NextResponse.json(organizacao);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      const msg = error.issues.map(i => i.message).join('; ');
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao atualizar organização' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();

    const { id } = await params;

    const existing = await prisma.organizacao.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    await prisma.organizacao.delete({ where: { id } });

    await writeAudit({
      userId: (await requireAuth()).id,
      organizacaoId: id,
      acao: 'EXCLUIR_ORGANIZACAO',
      entidade: 'Organizacao',
      entidadeId: id,
      antes: { nome: existing.nome, slug: existing.slug },
      req: request,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Erro ao excluir organização' }, { status: 500 });
  }
}