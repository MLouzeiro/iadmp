import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';
import { writeAudit } from '@/lib/audit';
import {
  resolveOrgScope,
  resolveTargetOrgId,
  ORG_FORBIDDEN,
  ORG_REQUIRED,
  orgForbiddenResponse,
} from '@/lib/tenant';
import { ministerioSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeVer = await hasPermission(user.id, 'ministerios', 'visualizar');
    if (!podeVer) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');
    const incluirInativos = searchParams.get('incluirInativos') === 'true';
    const scope = await resolveOrgScope(user, organizacaoId);

    const where: Record<string, unknown> = {};
    if (scope.requestedOrgId) {
      where.organizacaoId = scope.requestedOrgId;
    } else if (scope.mode !== 'ALL') {
      where.organizacaoId = { in: scope.orgIds };
    }
    if (!incluirInativos) where.ativo = true;

    const ministerios = await prisma.ministerio.findMany({
      where,
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(ministerios);
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (err.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar ministérios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeCriar = await hasPermission(user.id, 'ministerios', 'criar');
    if (!podeCriar) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const body = await request.json();
    const validated = ministerioSchema.parse(body);
    const organizacaoId = await resolveTargetOrgId(user, body.organizacaoId);

    const ministerio = await prisma.ministerio.create({
      data: {
        organizacaoId,
        nome: validated.nome,
        descricao: validated.descricao || null,
        responsavel: validated.responsavel || null,
        ativo: validated.ativo ?? true,
      },
    });

    await writeAudit({
      userId: user.id,
      organizacaoId,
      acao: 'CREATE',
      entidade: 'Ministerio',
      entidadeId: ministerio.id,
      depois: ministerio,
      req: request,
    });

    return NextResponse.json(ministerio, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (err.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    if (err.message === ORG_REQUIRED) {
      return NextResponse.json({ error: 'Selecione a organiza\u00e7\u00e3o do registro' }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return NextResponse.json(
        { error: `Dados inválidos — ${first.path.join('.')}: ${first.message}` },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Erro ao criar ministério' }, { status: 500 });
  }
}
