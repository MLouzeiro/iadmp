import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { liderancaSchema } from '@/lib/validations';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
  try {
    await requireAuth();
    const lideres = await prisma.lideranca.findMany({
      include: { ministerio: true },
      orderBy: { ordemExibicao: 'asc' },
    });
    return NextResponse.json(lideres);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    return NextResponse.json({ error: 'Erro ao buscar lideranca' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const validated = liderancaSchema.parse(body);

    const lider = await prisma.lideranca.create({
      data: {
        nome: validated.nome,
        cargo: validated.cargo,
        biografia: validated.biografia || null,
        ordemExibicao: validated.ordemExibicao || 0,
        publico: validated.publico ?? true,
        ativo: validated.ativo ?? true,
        dataInicio: validated.dataInicio ? new Date(validated.dataInicio) : null,
        dataFim: validated.dataFim ? new Date(validated.dataFim) : null,
        membroId: validated.membroId || null,
        ministerioId: validated.ministerioId || null,
      },
    });

    return NextResponse.json(lider, { status: 201 });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (error?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Dados invalidos', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao criar lider' }, { status: 500 });
  }
}
