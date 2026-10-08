import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { resolveOrgScope, ORG_FORBIDDEN, orgForbiddenResponse } from '@/lib/tenant';
import { indicadoresDashboardLegado } from '@/lib/indicadores';

/**
 * Mantido por compatibilidade com o painel atual.
 * Os números vêm do core `src/lib/indicadores.ts` — não recalcular aqui.
 */
export async function GET(request?: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request?.url || 'http://localhost/');
    const organizacaoId = searchParams.get('organizacaoId');

    const scope = await resolveOrgScope(user, organizacaoId);

    const filtros = {
      organizacaoIds: scope.requestedOrgId
        ? [scope.requestedOrgId]
        : scope.mode === 'ALL'
          ? []
          : scope.orgIds,
      congregacaoId: null,
      eventoId: null,
      categoria: null,
      status: null,
    };

    const dados = await indicadoresDashboardLegado(filtros);
    return NextResponse.json(dados);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar dados do dashboard' }, { status: 500 });
  }
}
