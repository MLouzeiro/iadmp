import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
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

export const oportunidadeSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  generoOportunidade: z.string().optional(),
  responsavel: z.string().optional(),
  prazo: z.string().optional(),
  vagas: z.number().int().min(0).optional(),
  abrirOportunidade: z.enum(['ATIVA', 'ENCERRADA', 'SUSPENSA']).optional(),
  observacoes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeVer = await hasPermission(user.id, 'oportunidades', 'visualizar');
    if (!podeVer) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');
    const scope = await resolveOrgScope(user, organizacaoId);

    const where: Record<string, unknown> = {};
    if (scope.requestedOrgId) {
      where.organizacaoId = scope.requestedOrgId;
    } else if (scope.mode !== 'ALL') {
      where.organizacaoId = { in: scope.orgIds };
    }

    const oportunidades = await prisma.oportunidade.findMany({
      where,
      include: {
        congregacao: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(oportunidades);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar oportunidades' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeCriar = await hasPermission(user.id, 'oportunidades', 'criar');
    if (!podeCriar) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const body = await request.json();
    const validated = oportunidadeSchema.parse(body);
    const organizacaoId = await resolveTargetOrgId(user, body.organizacaoId);

    const congregacaoId = await resolveCongregacaoId(organizacaoId, {
      congregacaoId: body.congregacaoId,
      congregacao: body.congregacao,
    });

    const oportunidade = await prisma.oportunidade.create({
      data: {
        organizacaoId,
        congregacaoId,
        titulo: validated.titulo,
        descricao: validated.descricao,
        generoOportunidade: validated.generoOportunidade || 'VOLUNTARIADO',
        responsavel: validated.responsavel || null,
        prazo: validated.prazo ? parseDataDateOnly(validated.prazo) : null,
        vagas: validated.vagas ?? null,
        abrirOportunidade: validated.abrirOportunidade || 'ATIVA',
        observacoes: validated.observacoes || null,
      },
      include: { congregacao: { select: { id: true, nome: true } } },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId,
      acao: 'CREATE',
      entidade: 'Oportunidade',
      entidadeId: oportunidade.id,
      depois: oportunidade,
      req: request,
    });

    return NextResponse.json(oportunidade, { status: 201 });
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
    return NextResponse.json({ error: 'Erro ao criar oportunidade' }, { status: 500 });
  }
}
