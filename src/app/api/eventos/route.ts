import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { eventoSchema } from '@/lib/validations';
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
    const status = searchParams.get('status');

    const scope = await resolveOrgScope(user, organizacaoId);

    const where: Record<string, unknown> = {};
    if (scope.requestedOrgId) {
      where.organizacaoId = scope.requestedOrgId;
    } else if (scope.mode !== 'ALL') {
      where.organizacaoId = { in: scope.orgIds };
    }
    if (congregacaoId) where.congregacaoId = congregacaoId;
    if (status) where.status = status;

    const eventos = await prisma.evento.findMany({
      where,
      include: {
        categoria: true,
        campanha: true,
        avaliacao: true,
        congregacao: { select: { id: true, nome: true } },
        organizacao: { select: { id: true, nome: true } },
      },
      orderBy: { dataEvento: 'desc' },
    });
    return NextResponse.json(eventos);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeCriar = await hasPermission(user.id, 'eventos', 'criar');
    if (!podeCriar) return NextResponse.json({ error: 'Sem permissao para criar eventos' }, { status: 403 });

    const body = await request.json();
    const validated = eventoSchema.parse(body);
    const organizacaoId = await resolveTargetOrgId(user, body.organizacaoId);

    const congregacaoId = await resolveCongregacaoId(organizacaoId, {
      congregacaoId: body.congregacaoId,
      congregacao: body.congregacao,
    });

    const evento = await prisma.evento.create({
      data: {
        organizacaoId,
        congregacaoId,
        nome: validated.nome,
        categoriaId: validated.categoriaId || null,
        dataInicio: new Date(validated.dataInicio),
        dataEvento: new Date(validated.dataEvento),
        dataFim: validated.dataFim ? new Date(validated.dataFim) : null,
        tema: validated.tema || null,
        preletores: validated.preletores || [],
        diasDuracao: validated.diasDuracao || null,
        status: validated.status || 'PLANEJADO',
        observacoes: validated.observacoes || null,
        local: validated.local || null,
        responsavelGeral: validated.responsavelGeral || null,
        publicarNoSite: validated.publicarNoSite ?? false,
        orcamentoPrevisto: validated.orcamentoPrevisto || null,
      },
      include: { categoria: true, congregacao: { select: { id: true, nome: true } } },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId,
      acao: 'CREATE',
      entidade: 'Evento',
      entidadeId: evento.id,
      depois: evento,
      req: request,
    });

    return NextResponse.json(evento, { status: 201 });
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
    return NextResponse.json({ error: 'Erro ao criar evento' }, { status: 500 });
  }
}
