import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inscricaoAdminSchema } from '@/lib/validations';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';
import { writeAudit } from '@/lib/audit';
import {
  resolveOrgScope,
  resolveTargetOrgId,
  ORG_FORBIDDEN,
  ORG_REQUIRED,
  orgForbiddenResponse,
} from '@/lib/tenant';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeVer = await hasPermission(user.id, 'eventos', 'visualizar');
    if (!podeVer) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { id: eventoId } = await params;
    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');
    const scope = await resolveOrgScope(user, organizacaoId);

    const evento = await prisma.evento.findUnique({ where: { id: eventoId }, select: { id: true, organizacaoId: true } });
    if (!evento) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });

    const where: Record<string, unknown> = { eventoId };
    if (scope.requestedOrgId) {
      where.organizacaoId = scope.requestedOrgId;
    } else if (scope.mode !== 'ALL') {
      where.organizacaoId = { in: scope.orgIds };
    }

    const inscricoes = await prisma.inscricao.findMany({
      where,
      include: {
        membro: { select: { id: true, nome: true } },
        pagamentos: {
          select: { id: true, valor: true, forma: true, status: true, dataPagamento: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(inscricoes);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar inscrições' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const podeCriar = await hasPermission(user.id, 'eventos', 'criar');
    if (!podeCriar) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { id: eventoId } = await params;
    const body = await request.json();
    const validated = inscricaoAdminSchema.parse(body);

    const evento = await prisma.evento.findUnique({
      where: { id: eventoId },
      select: { id: true, organizacaoId: true, taxaInscricao: true, limiteInscricoes: true },
    });
    if (!evento) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });

    const organizacaoId = await resolveTargetOrgId(user, body.organizacaoId || evento.organizacaoId);

    if (evento.limiteInscricoes != null) {
      const total = await prisma.inscricao.count({
        where: { eventoId, status: { in: ['PENDENTE', 'CONFIRMADA'] } },
      });
      if (total >= evento.limiteInscricoes) {
        return NextResponse.json({ error: 'Inscrições esgotadas' }, { status: 400 });
      }
    }

    const inscricao = await prisma.inscricao.create({
      data: {
        organizacaoId,
        eventoId,
        membroId: validated.membroId || null,
        nome: validated.nome,
        email: validated.email || null,
        telefone: validated.telefone || null,
        status: validated.status || 'PENDENTE',
        valorPrevisto: validated.valorPrevisto ?? (evento.taxaInscricao ? Number(evento.taxaInscricao) : null),
        observacoes: validated.observacoes || null,
        createdById: user.id,
      },
      include: { membro: { select: { id: true, nome: true } } },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId,
      acao: 'CREATE',
      entidade: 'Inscricao',
      entidadeId: inscricao.id,
      depois: inscricao,
      req: request,
    });

    return NextResponse.json(inscricao, { status: 201 });
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
    return NextResponse.json({ error: 'Erro ao criar inscrição' }, { status: 500 });
  }
}
