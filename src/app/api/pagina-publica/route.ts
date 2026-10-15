import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, requireSuperAdmin } from '@/lib/auth-helpers';
import { writeAudit } from '@/lib/audit';
import { resolveTargetOrgId, ORG_FORBIDDEN, orgForbiddenResponse } from '@/lib/tenant';

const paginaPublicaSchema = z.object({
  secaoHero: z.any().optional(),
  secaoPalavraDia: z.any().optional(),
  secaoSobre: z.any().optional(),
  secaoEventos: z.any().optional(),
  secaoLideranca: z.any().optional(),
  secaoGaleria: z.any().optional(),
  secaoContato: z.any().optional(),
  secaoPregacoes: z.any().optional(),
  secaoPilares: z.any().optional(),
  secaoMinisterios: z.any().optional(),
  secaoRodapeInfo: z.any().optional(),
  conteudo: z.any().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');

    const targetOrgId = await resolveTargetOrgId(user, organizacaoId);
    const canManage = await hasPermission(user.id, 'configuracoes', 'editar');
    if (!canManage && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const pagina = await prisma.paginaPublica.findUnique({
      where: { organizacaoId: targetOrgId },
    });

    if (!pagina) {
      return NextResponse.json({});
    }

    return NextResponse.json(pagina);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    return NextResponse.json({ error: 'Erro ao buscar página pública' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const canManage = await hasPermission(user.id, 'configuracoes', 'editar');
    if (!canManage && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Sem permissão para editar site público' }, { status: 403 });
    }

    const body = await request.json();
    const validated = paginaPublicaSchema.parse(body);

    const organizacaoId = await resolveTargetOrgId(user, body.organizacaoId);

    const data: Record<string, unknown> = {};
    if (validated.secaoHero !== undefined) data.secaoHero = validated.secaoHero;
    if (validated.secaoPalavraDia !== undefined) data.secaoPalavraDia = validated.secaoPalavraDia;
    if (validated.secaoSobre !== undefined) data.secaoSobre = validated.secaoSobre;
    if (validated.secaoEventos !== undefined) data.secaoEventos = validated.secaoEventos;
    if (validated.secaoLideranca !== undefined) data.secaoLideranca = validated.secaoLideranca;
    if (validated.secaoGaleria !== undefined) data.secaoGaleria = validated.secaoGaleria;
    if (validated.secaoContato !== undefined) data.secaoContato = validated.secaoContato;
    if (validated.secaoPregacoes !== undefined) data.secaoPregacoes = validated.secaoPregacoes;
    if (validated.secaoPilares !== undefined) data.secaoPilares = validated.secaoPilares;
    if (validated.secaoMinisterios !== undefined) data.secaoMinisterios = validated.secaoMinisterios;
    if (validated.secaoRodapeInfo !== undefined) data.secaoRodapeInfo = validated.secaoRodapeInfo;
    if (validated.conteudo !== undefined) data.conteudo = validated.conteudo;

    const pagina = await prisma.paginaPublica.upsert({
      where: { organizacaoId },
      create: { organizacaoId, ...data },
      update: data,
    });

    await writeAudit({
      userId: user.id,
      organizacaoId,
      acao: 'ATUALIZAR_PAGINA_PUBLICA',
      entidade: 'PaginaPublica',
      entidadeId: pagina.id,
      depois: data,
      req: request,
    });

    return NextResponse.json(pagina);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    if (error?.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    if (error instanceof z.ZodError) {
      const msg = error.issues.map(i => i.message).join('; ');
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao salvar página pública' }, { status: 500 });
  }
}