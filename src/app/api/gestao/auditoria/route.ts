import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';
import {
  resolveOrgScope,
  ORG_FORBIDDEN,
  orgForbiddenResponse,
} from '@/lib/tenant';

/**
 * GET /api/gestao/auditoria
 * Filtros: organizacaoId, userId, acao, entidade, entidadeId, dataInicio, dataFim.
 * Exige a permissao `usuarios:ver_auditoria` e respeita o escopo de organizacao.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeVer = await hasPermission(user.id, 'usuarios', 'ver_auditoria');
    if (!podeVer && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Sem permissão para consultar auditoria' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');
    const userId = searchParams.get('userId');
    const acao = searchParams.get('acao');
    const entidade = searchParams.get('entidade');
    const entidadeId = searchParams.get('entidadeId');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    const scope = await resolveOrgScope(user, organizacaoId);

    const where: Record<string, unknown> = {};
    if (scope.requestedOrgId) {
      where.organizacaoId = scope.requestedOrgId;
    } else if (scope.mode !== 'ALL') {
      where.organizacaoId = { in: scope.orgIds };
    }
    if (userId) where.userId = userId;
    if (acao) where.acao = acao;
    if (entidade) where.entidade = entidade;
    if (entidadeId) where.entidadeId = entidadeId;
    if (dataInicio || dataFim) {
      const createdAt: Record<string, Date> = {};
      if (dataInicio) createdAt.gte = new Date(dataInicio);
      if (dataFim) createdAt.lte = new Date(dataFim);
      where.createdAt = createdAt;
    }

    const [registros, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          organizacao: { select: { id: true, nome: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      registros,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
    return NextResponse.json({ error: 'Erro ao consultar auditoria' }, { status: 500 });
  }
}
