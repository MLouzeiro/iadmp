import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { avisoSchema } from '@/lib/validations';
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
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar avisos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeCriar = await hasPermission(user.id, 'avisos', 'criar');
    if (!podeCriar) return NextResponse.json({ error: 'Sem permissão para criar avisos' }, { status: 403 });

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
        imagem: validated.imagem || null,
        categoria: validated.categoria || null,
        comecaEm: validated.dataInicio ? parseDataDateOnly(validated.dataInicio) : new Date(),
        terminaEm: validated.dataFim ? parseDataDateOnly(validated.dataFim) : null,
        urgencia: validated.urgencia || 'NORMAL',
        situacaoAviso: validated.situacaoAviso || 'ATIVO',
        publicoAlvo: validated.publicoAlvo || null,
        publicarSite: validated.publicarSite ?? false,
        mostrarPainel: validated.mostrarPainel ?? true,
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
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    if (error?.message === ORG_REQUIRED) {
      return NextResponse.json({ error: 'Selecione a organiza\u00e7\u00e3o do registro' }, { status: 400 });
    }
    if (error instanceof Error && error.name === 'ZodError') {
      const issues = (error as unknown as { issues?: { path?: unknown[]; message: string }[] }).issues || [];
      const detalhes = issues
        .slice(0, 3)
        .map((i) => `${(i.path || []).map(String).join('.') || 'dados'}: ${i.message}`)
        .join(' | ');
      return NextResponse.json(
        { error: detalhes ? `Dados inválidos — ${detalhes}` : 'Dados inválidos' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Erro ao criar aviso' }, { status: 500 });
  }
}
