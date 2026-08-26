import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const totalMembros = await prisma.membro.count({ where: { status: 'ATIVO' } });
    const totalLideres = await prisma.lideranca.count({ where: { ativo: true } });

    const eventosRealizados = await prisma.evento.count({
      where: { status: 'CONCLUIDO', dataEvento: { gte: startOfYear, lte: now } },
    });

    const eventosFuturos = await prisma.evento.count({
      where: { status: 'PLANEJADO', dataEvento: { gte: now } },
    });

    const avisosAtivos = await prisma.aviso.count({
      where: { situacaoAviso: 'ATIVO', terminaEm: { gte: now } },
    });

    return NextResponse.json({
      totalMembros,
      totalLideres,
      eventosRealizados,
      eventosFuturos,
      avisosAtivos,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar dados do dashboard' }, { status: 500 });
  }
}
