import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { resolveOrgScope, ORG_FORBIDDEN, orgForbiddenResponse } from '@/lib/tenant';
import { indicadoresLiderancaDetalhada } from '@/lib/indicadores';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');
    const cargo = searchParams.get('cargo');
    const ministerioId = searchParams.get('ministerioId');
    const situacao = searchParams.get('situacao');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    const scope = await resolveOrgScope(user, organizacaoId);
    const organizacaoIds = scope.requestedOrgId
      ? [scope.requestedOrgId]
      : scope.mode === 'ALL'
        ? []
        : scope.orgIds;

    const filtros = {
      organizacaoIds,
      cargo: cargo || undefined,
      ministerioId: ministerioId || undefined,
      situacao: situacao || undefined,
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
    };

    const dados = await indicadoresLiderancaDetalhada(filtros);
    return NextResponse.json(dados);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar indicadores detalhados de liderança' }, { status: 500 });
  }
}