import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { membroSchema } from '@/lib/validations';
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const organizacaoId = searchParams.get('organizacaoId');
    const congregacaoId = searchParams.get('congregacaoId');

    const scope = await resolveOrgScope(user, organizacaoId);

    const where: Record<string, unknown> = {};
    if (scope.mode !== 'ALL') {
      where.organizacaoId = scope.requestedOrgId
        ? scope.requestedOrgId
        : { in: scope.orgIds };
    } else if (scope.requestedOrgId) {
      where.organizacaoId = scope.requestedOrgId;
    }
    if (congregacaoId) where.congregacaoId = congregacaoId;
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [membros, total] = await Promise.all([
      prisma.membro.findMany({
        where,
        include: {
          ministerio: true,
          departamento: true,
          congregacao: { select: { id: true, nome: true } },
          organizacao: { select: { id: true, nome: true } },
        },
        orderBy: { nome: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.membro.count({ where }),
    ]);

    return NextResponse.json({ membros, total, page, limit });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar membros' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeCriar = await hasPermission(user.id, 'membros', 'criar');
    if (!podeCriar) return NextResponse.json({ error: 'Sem permissao para criar membros' }, { status: 403 });

    const body = await request.json();
    const validated = membroSchema.parse(body);
    const organizacaoId = await resolveTargetOrgId(user, body.organizacaoId);

    const congregacaoId = await resolveCongregacaoId(organizacaoId, {
      congregacaoId: body.congregacaoId,
      congregacao: validated.congregacao,
    });

    const membro = await prisma.membro.create({
      data: {
        organizacaoId,
        congregacaoId,
        nome: validated.nome,
        email: validated.email || null,
        telefone: validated.telefone || null,
        whatsapp: validated.whatsapp || null,
        dataNascimento: validated.dataNascimento ? new Date(validated.dataNascimento) : null,
        endereco: validated.endereco || null,
        status: validated.status || 'ATIVO',
        observacoes: validated.observacoes || null,
        ministerioId: validated.ministerioId || null,
        departamentoId: validated.departamentoId || null,
      },
      include: { congregacao: { select: { id: true, nome: true } } },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId,
      acao: 'CREATE',
      entidade: 'Membro',
      entidadeId: membro.id,
      depois: membro,
      req: request,
    });

    return NextResponse.json(membro, { status: 201 });
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
    return NextResponse.json({ error: 'Erro ao criar membro' }, { status: 500 });
  }
}
