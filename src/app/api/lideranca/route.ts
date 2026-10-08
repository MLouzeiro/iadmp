import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { liderancaSchema } from '@/lib/validations';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';
import { writeAudit } from '@/lib/audit';
import { parseDataDateOnly } from '@/lib/datas';
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

    const scope = await resolveOrgScope(user, organizacaoId);

    const where: Record<string, unknown> = {};
    if (scope.requestedOrgId) {
      where.organizacaoId = scope.requestedOrgId;
    } else if (scope.mode !== 'ALL') {
      where.organizacaoId = { in: scope.orgIds };
    }
    if (congregacaoId) where.congregacaoId = congregacaoId;

    const lideres = await prisma.lideranca.findMany({
      where,
      include: {
        ministerio: true,
        congregacao: { select: { id: true, nome: true } },
        organizacao: { select: { id: true, nome: true } },
      },
      orderBy: { ordemExibicao: 'asc' },
    });
    return NextResponse.json(lideres);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar liderança' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeCriar = await hasPermission(user.id, 'lideranca', 'criar');
    if (!podeCriar) return NextResponse.json({ error: 'Sem permissão para criar liderança' }, { status: 403 });

    const body = await request.json();
    const validated = liderancaSchema.parse(body);
    const organizacaoId = await resolveTargetOrgId(user, body.organizacaoId);

    const congregacaoId = await resolveCongregacaoId(organizacaoId, {
      congregacaoId: body.congregacaoId,
      congregacao: body.congregacao,
    });

    const lider = await prisma.lideranca.create({
      data: {
        organizacaoId,
        congregacaoId,
        nome: validated.nome,
        cargo: validated.cargo,
        biografia: validated.biografia || null,
        ordemExibicao: validated.ordemExibicao || 0,
        publico: validated.publico ?? true,
        ativo: validated.ativo ?? true,
        dataInicio: validated.dataInicio ? parseDataDateOnly(validated.dataInicio) : null,
        dataFim: validated.dataFim ? parseDataDateOnly(validated.dataFim) : null,
        membroId: validated.membroId || null,
        ministerioId: validated.ministerioId || null,
      },
      include: { congregacao: { select: { id: true, nome: true } } },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId,
      acao: 'CREATE',
      entidade: 'Lideranca',
      entidadeId: lider.id,
      depois: lider,
      req: request,
    });

    return NextResponse.json(lider, { status: 201 });
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
    return NextResponse.json({ error: 'Erro ao criar líder' }, { status: 500 });
  }
}
