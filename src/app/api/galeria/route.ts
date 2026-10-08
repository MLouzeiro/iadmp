import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';
import { writeAudit } from '@/lib/audit';
import {
  resolveOrgScope,
  resolveTargetOrgId,
  resolveCongregacaoId,
  ORG_FORBIDDEN,
  ORG_REQUIRED,
  orgForbiddenResponse,
} from '@/lib/tenant';

export const galeriaItemSchema = z.object({
  titulo: z.string().optional(),
  descricao: z.string().optional(),
  url: z.string().min(1, 'URL é obrigatória'),
  classArquivo: z.enum(['FOTO', 'VIDEO', 'DOCUMENTO']).optional(),
  ordem: z.number().int().optional(),
  albumId: z.string().optional(),
  eventoId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeVer = await hasPermission(user.id, 'galeria', 'visualizar');
    if (!podeVer) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');
    const albumId = searchParams.get('albumId');
    const scope = await resolveOrgScope(user, organizacaoId);

    const where: Record<string, unknown> = {};
    if (scope.requestedOrgId) {
      where.organizacaoId = scope.requestedOrgId;
    } else if (scope.mode !== 'ALL') {
      where.organizacaoId = { in: scope.orgIds };
    }
    if (albumId) where.albumId = albumId;

    const itens = await prisma.galeriaItem.findMany({
      where,
      include: {
        album: { select: { id: true, nome: true } },
        evento: { select: { id: true, nome: true } },
      },
      orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(itens);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar galeria' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeCriar = await hasPermission(user.id, 'galeria', 'criar');
    if (!podeCriar) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const body = await request.json();
    const validated = galeriaItemSchema.parse(body);
    const organizacaoId = await resolveTargetOrgId(user, body.organizacaoId);

    const congregacaoId = await resolveCongregacaoId(organizacaoId, {
      congregacaoId: body.congregacaoId,
      congregacao: body.congregacao,
    });

    const item = await prisma.galeriaItem.create({
      data: {
        organizacaoId,
        congregacaoId,
        titulo: validated.titulo || null,
        descricao: validated.descricao || null,
        url: validated.url,
        classArquivo: validated.classArquivo || 'FOTO',
        ordem: validated.ordem ?? 0,
        albumId: validated.albumId || null,
        eventoId: validated.eventoId || null,
      },
      include: { album: { select: { id: true, nome: true } } },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId,
      acao: 'CREATE',
      entidade: 'GaleriaItem',
      entidadeId: item.id,
      depois: item,
      req: request,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    if (error?.message === ORG_REQUIRED) {
      return NextResponse.json({ error: 'Selecione a organiza\u00e7\u00e3o do registro' }, { status: 400 });
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao criar item' }, { status: 500 });
  }
}
