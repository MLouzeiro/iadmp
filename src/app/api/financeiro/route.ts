import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { financeiroSchema } from '@/lib/validations';
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
    const podeVer = await hasPermission(user.id, 'financeiro', 'visualizar');
    if (!podeVer) return NextResponse.json({ error: 'Sem permissão para visualizar financeiro' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');
    const congregacaoId = searchParams.get('congregacaoId');
    const categoria = searchParams.get('categoria');
    const tipo = searchParams.get('tipo');

    const scope = await resolveOrgScope(user, organizacaoId);

    const where: Record<string, unknown> = {};
    if (scope.requestedOrgId) {
      where.organizacaoId = scope.requestedOrgId;
    } else if (scope.mode !== 'ALL') {
      where.organizacaoId = { in: scope.orgIds };
    }
    if (congregacaoId) where.congregacaoId = congregacaoId;
    if (categoria) where.categoria = categoria;
    if (tipo) where.generoMovimentacao = tipo;

    const lancamentos = await prisma.eventoFinanceiro.findMany({
      where,
      include: {
        congregacao: { select: { id: true, nome: true } },
        evento: { select: { id: true, nome: true } },
      },
      orderBy: { quando: 'desc' },
    });

    return NextResponse.json(lancamentos);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar lançamentos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeCriar = await hasPermission(user.id, 'financeiro', 'criar');
    if (!podeCriar) return NextResponse.json({ error: 'Sem permissão para criar lançamentos' }, { status: 403 });

    const body = await request.json();
    const validated = financeiroSchema.parse(body);
    const organizacaoId = await resolveTargetOrgId(user, body.organizacaoId);

    const congregacaoId = await resolveCongregacaoId(organizacaoId, {
      congregacaoId: body.congregacaoId,
      congregacao: body.congregacao,
    });

    const lancamento = await prisma.eventoFinanceiro.create({
      data: {
        organizacaoId,
        congregacaoId,
        descricao: validated.descricao,
        valor: validated.valor,
        quando: validated.data ? parseDataDateOnly(validated.data) : new Date(),
        generoMovimentacao: validated.tipo,
        categoria: (validated.categoria as 'DIZIMO' | 'OFERTA' | 'DOACAO' | 'INSCRICAO' | 'DESPESA' | 'OUTRO') || 'OUTRO',
        fornecedor: validated.fornecedor || null,
        responsavel: validated.responsavel || null,
        observacoes: validated.observacoes || null,
        categoriaFinanceiraId: validated.categoriaFinanceiraId || null,
      },
      include: { congregacao: { select: { id: true, nome: true } } },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId,
      acao: 'CREATE',
      entidade: 'EventoFinanceiro',
      entidadeId: lancamento.id,
      depois: lancamento,
      req: request,
    });

    return NextResponse.json(lancamento, { status: 201 });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    if (error?.message === ORG_REQUIRED) {
      return NextResponse.json({ error: 'organizacaoId é obrigatório' }, { status: 400 });
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao criar lançamento' }, { status: 500 });
  }
}
