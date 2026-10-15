import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';
import { listarCandidatosLimpeza } from '@/lib/storage';

// GET /api/storage/limpeza — lista candidatos a limpeza (diagnóstico)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeVerTudo = user.role === 'SUPER_ADMIN';
    if (!podeVerTudo && !(await hasPermission(user.id, 'configuracoes', 'ver'))) {
      return NextResponse.json({ error: 'Sem permissão para ver ferramenta de limpeza.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const organizacaoIdParam = searchParams.get('organizacaoId');
    const limite = Math.min(parseInt(searchParams.get('limite') || '50', 10) || 50, 200);

    let escopoOrg: string | undefined;
    if (organizacaoIdParam) {
      if (!podeVerTudo && !(await canManageOrganization(user.id, organizacaoIdParam))) {
        return NextResponse.json({ error: 'Sem permissão para esta organização.' }, { status: 403 });
      }
      escopoOrg = organizacaoIdParam;
    }

    const candidatos = await listarCandidatosLimpeza(escopoOrg, limite);
    return NextResponse.json({ candidatos });
  } catch (e) {
    return NextResponse.json({ error: `Erro ao listar candidatos: ${(e as Error).message}` }, { status: 500 });
  }
}
