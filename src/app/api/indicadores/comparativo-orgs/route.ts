import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireSuperAdmin } from '@/lib/auth-helpers';
import { ORG_FORBIDDEN, orgForbiddenResponse } from '@/lib/tenant';
import { calcularIndicadores, resolvePeriodo } from '@/lib/indicadores';

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const organizacaoIdsParam = searchParams.get('organizacaoIds');
    const periodo = searchParams.get('periodo') || 'mes_atual';
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    let organizacaoIds: string[] = [];
    if (organizacaoIdsParam) {
      organizacaoIds = organizacaoIdsParam.split(',').filter(Boolean);
    }

    if (organizacaoIds.length === 0) {
      const allOrgs = await prisma.organizacao.findMany({ where: { ativo: true }, select: { id: true } });
      organizacaoIds = allOrgs.map(o => o.id);
    }

    const periodoObj = resolvePeriodo(periodo as any, { dataInicio: dataInicio || undefined, dataFim: dataFim || undefined });

    const filtros = {
      organizacaoIds,
      congregacaoId: null,
      eventoId: null,
      categoria: null,
      status: null,
    };

    const resultados = await Promise.all(
      organizacaoIds.map(async (orgId) => {
        const orgFiltros = { ...filtros, organizacaoIds: [orgId] };
        const indicadores = await calcularIndicadores(periodoObj, orgFiltros);
        const org = await prisma.organizacao.findUnique({ where: { id: orgId }, select: { id: true, nome: true, slug: true } });
        return { organizacao: org, indicadores };
      })
    );

    return NextResponse.json({
      periodo: { tipo: periodoObj.tipo, label: periodoObj.label, atual: periodoObj.atual, anterior: periodoObj.anterior },
      organizacoes: resultados,
    });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar comparativo entre organizações' }, { status: 500 });
  }
}