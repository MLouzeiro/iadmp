import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { eventoSchema } from '@/lib/validations';

export async function GET() {
  try {
    const eventos = await prisma.evento.findMany({
      include: { categoria: true, campanha: true, avaliacao: true },
      orderBy: { dataEvento: 'desc' },
    });
    return NextResponse.json(eventos);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = eventoSchema.parse(body);

    const evento = await prisma.evento.create({
      data: {
        nome: validated.nome,
        categoriaId: validated.categoriaId || null,
        dataInicio: new Date(validated.dataInicio),
        dataEvento: new Date(validated.dataEvento),
        dataFim: validated.dataFim ? new Date(validated.dataFim) : null,
        tema: validated.tema || null,
        preletores: validated.preletores || [],
        diasDuracao: validated.diasDuracao || null,
        status: validated.status || 'PLANEJADO',
        observacoes: validated.observacoes || null,
        local: validated.local || null,
        responsavelGeral: validated.responsavelGeral || null,
        publicarNoSite: validated.publicarNoSite ?? false,
        orcamentoPrevisto: validated.orcamentoPrevisto || null,
      },
      include: { categoria: true },
    });

    return NextResponse.json(evento, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar evento' }, { status: 500 });
  }
}
