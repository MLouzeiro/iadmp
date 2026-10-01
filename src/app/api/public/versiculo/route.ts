import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SLOT_DURATION_MS = 12 * 60 * 60 * 1000;

function getCurrentSlot(): number {
  const now = new Date();
  return Math.floor(now.getTime() / SLOT_DURATION_MS);
}

function getSlotStart(slot: number): Date {
  return new Date(slot * SLOT_DURATION_MS);
}

function getSlotEnd(slot: number): Date {
  return new Date((slot + 1) * SLOT_DURATION_MS);
}

function getNextSlotStart(): Date {
  const now = new Date();
  const currentSlot = getCurrentSlot();
  return getSlotEnd(currentSlot);
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');

    if (!organizacaoId) {
      return NextResponse.json({ error: 'organizacaoId e obrigatorio' }, { status: 400 });
    }

    const currentSlot = getCurrentSlot();

    const versiculosAtivos = await prisma.versiculoDiario.findMany({
      where: { organizacaoId, ativo: true },
      select: { id: true },
    });

    if (versiculosAtivos.length === 0) {
      return NextResponse.json({
        versiculo: null,
        proximoEm: getNextSlotStart().toISOString(),
        slot: currentSlot,
      });
    }

    const historicoRecente = await prisma.versiculoHistorico.findMany({
      where: {
        slot: { gte: currentSlot - 6 },
      },
      select: { versiculoId: true },
      orderBy: { slot: 'desc' },
    });

    const idsRecentes = new Set(historicoRecente.map(h => h.versiculoId));

    let versiculoSelecionado = await prisma.versiculoDiario.findFirst({
      where: {
        organizacaoId,
        ativo: true,
        id: { notIn: Array.from(idsRecentes) },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!versiculoSelecionado) {
      versiculoSelecionado = await prisma.versiculoDiario.findFirst({
        where: { organizacaoId, ativo: true },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!versiculoSelecionado) {
      return NextResponse.json({
        versiculo: null,
        proximoEm: getNextSlotStart().toISOString(),
        slot: currentSlot,
      });
    }

    const existingHistory = await prisma.versiculoHistorico.findUnique({
      where: { versiculoId_slot: { versiculoId: versiculoSelecionado.id, slot: currentSlot } },
    });

    if (!existingHistory) {
      await prisma.versiculoHistorico.create({
        data: {
          versiculoId: versiculoSelecionado.id,
          slot: currentSlot,
        },
      });
    }

    return NextResponse.json({
      versiculo: {
        id: versiculoSelecionado.id,
        referencia: versiculoSelecionado.referencia,
        versiculo: versiculoSelecionado.versiculo,
        reflexao: versiculoSelecionado.reflexao,
      },
      proximoEm: getNextSlotStart().toISOString(),
      slot: currentSlot,
    });
  } catch (error) {
    console.error('GET /api/public/versiculo error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
