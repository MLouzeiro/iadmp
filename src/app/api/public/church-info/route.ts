import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const organizacao = await prisma.organizacao.findFirst({
      where: { ativo: true },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      organizacaoId: organizacao?.id || null,
    });
  } catch (error) {
    console.error('GET /api/public/church-info error:', error);
    return NextResponse.json({ organizacaoId: null });
  }
}
