import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { resolveOrgScope, ORG_FORBIDDEN, orgForbiddenResponse } from '@/lib/tenant';
import { indicadoresLideranca } from '@/lib/indicadores';

/**
 * Indicadores de gestão de liderança (admin).
 * Contagens e tempos médios de mandato — veja `indicadoresLideranca` no core.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');

    const scope = await resolveOrgScope(user, organizacaoId);
    const organizacaoIds = scope.requestedOrgId
      ? [scope.requestedOrgId]
      : scope.mode === 'ALL'
        ? []
        : scope.orgIds;

    const dados = await indicadoresLideranca(organizacaoIds);
    return NextResponse.json(dados);
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (err.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar indicadores de liderança' }, { status: 500 });
  }
}
