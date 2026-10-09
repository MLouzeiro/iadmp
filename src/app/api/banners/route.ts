import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';
import { writeAudit } from '@/lib/audit';
import {
  resolveOrgScope,
  resolveTargetOrgId,
  ORG_FORBIDDEN,
  ORG_REQUIRED,
  orgForbiddenResponse,
} from '@/lib/tenant';
import { parseDataDateOnly } from '@/lib/datas';

export const bannerSchema = z.object({
  titulo: z.string().optional(),
  imagemUrl: z.string().min(1, 'URL da imagem é obrigatória'),
  tipo: z.enum(['BANNER', 'FLYER']).optional(),
  link: z.string().optional(),
  ordem: z.number().int().optional(),
  ativo: z.boolean().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeVer = await hasPermission(user.id, 'banners', 'visualizar');
    if (!podeVer) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');
    const scope = await resolveOrgScope(user, organizacaoId);

    const where: Record<string, unknown> = {};
    if (scope.requestedOrgId) {
      where.organizacaoId = scope.requestedOrgId;
    } else if (scope.mode !== 'ALL') {
      where.organizacaoId = { in: scope.orgIds };
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(banners);
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (err.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar banners' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeCriar = await hasPermission(user.id, 'banners', 'criar');
    if (!podeCriar) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const body = await request.json();
    const validated = bannerSchema.parse(body);
    const organizacaoId = await resolveTargetOrgId(user, body.organizacaoId);

    const banner = await prisma.banner.create({
      data: {
        organizacaoId,
        titulo: validated.titulo || null,
        imagemUrl: validated.imagemUrl,
        tipo: validated.tipo || 'BANNER',
        link: validated.link || null,
        ordem: validated.ordem ?? 0,
        ativo: validated.ativo ?? true,
        dataInicio: validated.dataInicio ? parseDataDateOnly(validated.dataInicio) : null,
        dataFim: validated.dataFim ? parseDataDateOnly(validated.dataFim) : null,
      },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId,
      acao: 'CREATE',
      entidade: 'Banner',
      entidadeId: banner.id,
      depois: banner,
      req: request,
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (err.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    if (err.message === ORG_REQUIRED) {
      return NextResponse.json({ error: 'Selecione a organiza\u00e7\u00e3o do registro' }, { status: 400 });
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao criar banner' }, { status: 500 });
  }
}
