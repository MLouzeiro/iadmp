import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { defaultColors } from '@/lib/theme-palettes';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';
import { writeAudit } from '@/lib/audit';
import {
  assertOrgAccess,
  resolveOrgScope,
  ORG_FORBIDDEN,
  orgForbiddenResponse,
} from '@/lib/tenant';

/**
 * GET e publico (o tema do site depende dele).
 * Aceita `?organizacaoId=`; sem ele, responde a configuracao mais antiga (compat single-tenant).
 */
export async function GET(request?: NextRequest) {
  try {
    const { searchParams } = new URL(request?.url || 'http://localhost/');
    const organizacaoId = searchParams.get('organizacaoId');

    let config = organizacaoId
      ? await prisma.configuracoesIgreja.findUnique({ where: { organizacaoId } })
      : await prisma.configuracoesIgreja.findFirst({ orderBy: { createdAt: 'asc' } });

    if (!config && organizacaoId) {
      config = await prisma.configuracoesIgreja.create({
        data: {
          organizacaoId,
          nomeIgreja: 'Igreja Assembleia de Deus Ministério da Promessa',
          ...defaultColors,
        },
      });
    }

    if (!config) {
      return NextResponse.json(defaultColors);
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching church config:', error);
    return NextResponse.json(defaultColors);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeEditar = await hasPermission(user.id, 'configuracoes', 'editar');
    if (!podeEditar) {
      return NextResponse.json({ error: 'Sem permissão para editar configurações' }, { status: 403 });
    }

    const body = await request.json();
    const scope = await resolveOrgScope(user, body.organizacaoId);

    const organizacaoId = scope.requestedOrgId || (scope.mode === 'SINGLE' ? scope.orgIds[0] : null);
    if (!organizacaoId) {
      return NextResponse.json(
        { error: 'Selecione a organiza\u00e7\u00e3o do registro para editar configurações' },
        { status: 400 }
      );
    }

    await assertOrgAccess(user.id, organizacaoId, request);

    const data = {
      nomeIgreja: body.nomeIgreja,
      logoUrl: body.logoUrl,
      logoDarkUrl: body.logoDarkUrl,
      faviconUrl: body.faviconUrl,
      corPrincipal: body.corPrincipal,
      corSecundaria: body.corSecundaria,
      corDestaque: body.corDestaque,
      corFundo: body.corFundo,
      corFundoClaro: body.corFundoClaro,
      corSuperficie: body.corSuperficie,
      corTexto: body.corTexto,
      corTextoSecundario: body.corTextoSecundario,
      corBorda: body.corBorda,
      tema: body.tema,
    };

    const config = await prisma.configuracoesIgreja.upsert({
      where: { organizacaoId },
      create: { organizacaoId, ...data },
      update: data,
    });

    await writeAudit({
      userId: user.id,
      organizacaoId,
      acao: 'CONFIG_CHANGE',
      entidade: 'ConfiguracoesIgreja',
      entidadeId: config.id,
      depois: data,
      req: request,
    });

    return NextResponse.json(config);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    console.error('Error updating church config:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configurações' },
      { status: 500 }
    );
  }
}
