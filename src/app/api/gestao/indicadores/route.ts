import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';
import {
  resolveOrgScope,
  ORG_FORBIDDEN,
  orgForbiddenResponse,
} from '@/lib/tenant';
import {
  calcularIndicadores,
  resolvePeriodo,
  type TipoPeriodo,
} from '@/lib/indicadores';

const PERIODOS: TipoPeriodo[] = [
  'hoje',
  'ontem',
  '7d',
  '30d',
  'mes_atual',
  'mes_anterior',
  'trimestre',
  'semestre',
  'ano',
  'personalizado',
];

/**
 * GET /api/gestao/indicadores
 * ?periodo=&dataInicio=&dataFim=&organizacaoId=&congregacaoId=&eventoId=&categoria=&status=
 *
 * Cada indicador vem com: valor, periodoAnterior, variacaoPercentual, media6Meses,
 * formula, origem, unidade e filtrosAplicados.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeVer = await hasPermission(user.id, 'dashboard', 'visualizar');
    if (!podeVer && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Sem permissão para ver indicadores' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const periodoParam = (searchParams.get('periodo') || 'mes_atual') as TipoPeriodo;
    if (!PERIODOS.includes(periodoParam)) {
      return NextResponse.json({ error: 'Período inválido' }, { status: 400 });
    }

    const periodo = resolvePeriodo(periodoParam, {
      dataInicio: searchParams.get('dataInicio') || undefined,
      dataFim: searchParams.get('dataFim') || undefined,
    });

    const scope = await resolveOrgScope(user, searchParams.get('organizacaoId'));

    const filtros = {
      organizacaoIds: scope.requestedOrgId
        ? [scope.requestedOrgId]
        : scope.mode === 'ALL'
          ? []
          : scope.orgIds,
      congregacaoId: searchParams.get('congregacaoId'),
      eventoId: searchParams.get('eventoId'),
      categoria: searchParams.get('categoria'),
      status: searchParams.get('status'),
    };

    const indicadores = await calcularIndicadores(periodo, filtros);

    return NextResponse.json({
      periodo: {
        tipo: periodo.tipo,
        label: periodo.label,
        atual: {
          inicio: periodo.atual.inicio.toISOString(),
          fim: periodo.atual.fim.toISOString(),
        },
        anterior: {
          inicio: periodo.anterior.inicio.toISOString(),
          fim: periodo.anterior.fim.toISOString(),
        },
      },
      filtrosAplicados: filtros,
      indicadores,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
      if (error.message === 'FORBIDDEN') {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
      }
      if (error.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    }
    return NextResponse.json({ error: 'Erro ao calcular indicadores' }, { status: 500 });
  }
}
