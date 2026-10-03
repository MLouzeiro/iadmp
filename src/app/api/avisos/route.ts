import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { avisoSchema } from '@/lib/validations';
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

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');
    const congregacaoId = searchParams.get('congregacaoId');
    const now = new Date();

    const scope = await resolveOrgScope(user, organizacaoId);

    const where: Record<string, unknown> = {
      publicarSite: true,
      situacaoAviso: 'ATIVO',
      OR: [{ terminaEm: null }, { terminaEm: { gte: now } }],
    };
    if (scope.requestedOrgId) {
      where.organizacaoId = scope.requestedOrgId;
    } else if (scope.mode !== 'ALL') {
      where.organizacaoId = { in: scope.orgIds };
    }
    if (congregacaoId) where.congregacaoId = congregacaoId;

    const avisos = await prisma.aviso.findMany({
      where,
      include: {
        congregacao: { select: { id: true, nome: true } },
        organizacao: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(avisos);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar avisos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeCriar = await hasPermission(user.id, 'avisos', 'criar');
    if (!podeCriar) return NextResponse.json({ error: 'Sem permissao para criar avisos' }, { status: 403 });

    const body = await request.json();
    const validated = avisoSchema.parse(body);
    const organizacaoId = await resolveTargetOrgId(user, body.organizacaoId);

    const congregacaoId = await resolveCongregacaoId(organizacaoId, {
      congregacaoId: body.congregacaoId,
      congregacao: body.congregacao,
    });

    const aviso = await prisma.aviso.create({
      data: {
        organizacaoId,
        congregacaoId,
        titulo: validated.titulo,
        descricao: validated.descricao,
        imagem: body.imagem || null,
        categoria: body.categoria || null,
        comecaEm: validated.dataInicio ? new Date(validated.dataInicio) : new Date(),
        terminaEm: validated.dataFim ? new Date(validated.dataFim) : null,
        urgencia: body.urgencia || 'NORMAL',
        situacaoAviso: validated.status || 'ATIVO',
        publicoAlvo: validated.publicoAlvo || null,
        publicarSite: validated.publicarNoSite ?? false,
        mostrarPainel: validated.exibirNoPainel ?? true,
        destaque: validated.destaque ?? false,
      },
      include: { congregacao: { select: { id: true, nome: true } } },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId,
      acao: 'CREATE',
      entidade: 'Aviso',
      entidadeId: aviso.id,
      depois: aviso,
      req: request,
    });

    return NextResponse.json(aviso, { status: 201 });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    if (error?.message === ORG_REQUIRED) {
      return NextResponse.json({ error: 'organizacaoId e obrigatorio' }, { status: 400 });
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao criar aviso' }, { status: 500 });
  }
}
