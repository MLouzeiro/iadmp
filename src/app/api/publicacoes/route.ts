import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireSuperAdmin, hasPermission } from '@/lib/auth-helpers';
import { writeAudit } from '@/lib/audit';

const criarPublicacaoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  conteudo: z.string().min(1, 'Conteúdo é obrigatório'),
  tipo: z.string().default('AVISO'),
  organizacoesIds: z.array(z.string()).min(1, 'Selecione pelo menos uma organização'),
});

const listarPublicacoesSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  tipo: z.string().optional(),
  organizacaoId: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeVer = await hasPermission(user.id, 'comunicacao', 'visualizar');
    if (!podeVer && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Sem permissão para listar publicações' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const tipo = searchParams.get('tipo') || '';
    const organizacaoId = searchParams.get('organizacaoId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { conteudo: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (tipo) where.tipo = tipo;

    if (organizacaoId) {
      if (user.role !== 'SUPER_ADMIN') {
        const allowed = await prisma.usuarioOrganizacao.findUnique({
          where: { userId_organizacaoId: { userId: user.id, organizacaoId } },
        });
        if (!allowed) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
      where.destinos = { some: { organizacaoId } };
    } else if (user.role !== 'SUPER_ADMIN') {
      const userOrgs = await prisma.usuarioOrganizacao.findMany({
        where: { userId: user.id },
        select: { organizacaoId: true },
      });
      const orgIds = userOrgs.map(u => u.organizacaoId);
      where.destinos = { some: { organizacaoId: { in: orgIds } } };
    }

    const [publicacoes, total] = await Promise.all([
      prisma.publicacao.findMany({
        where,
        include: {
          autor: { select: { id: true, name: true, email: true } },
          publicadoPor: { select: { id: true, name: true, email: true } },
          destinos: {
            include: {
              organizacao: { select: { id: true, nome: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.publicacao.count({ where }),
    ]);

    return NextResponse.json({ publicacoes, total, page, limit });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    return NextResponse.json({ error: 'Erro ao buscar publicações' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const body = await request.json();
    const validated = criarPublicacaoSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const publicacao = await tx.publicacao.create({
        data: {
          titulo: validated.titulo,
          conteudo: validated.conteudo,
          tipo: validated.tipo,
          autorId: (await requireAuth()).id,
          status: 'RASCUNHO',
        },
      });

      for (const orgId of validated.organizacoesIds) {
        await tx.publicacaoOrganizacao.create({
          data: {
            publicacaoId: publicacao.id,
            organizacaoId: orgId,
            status: 'PENDENTE',
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: (await requireAuth()).id,
          acao: 'CRIAR_PUBLICACAO',
          entidade: 'Publicacao',
          entidadeId: publicacao.id,
          depois: { titulo: publicacao.titulo, tipo: publicacao.tipo, destinos: validated.organizacoesIds },
        },
      });

      return publicacao;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    if (error instanceof z.ZodError) {
      const msg = error.issues.map(i => i.message).join('; ');
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao criar publicação' }, { status: 500 });
  }
}