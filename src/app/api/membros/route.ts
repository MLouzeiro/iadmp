import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { membroSchema } from '@/lib/validations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [membros, total] = await Promise.all([
      prisma.membro.findMany({
        where,
        include: { ministerio: true, departamento: true },
        orderBy: { nome: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.membro.count({ where }),
    ]);

    return NextResponse.json({ membros, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar membros' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = membroSchema.parse(body);

    const membro = await prisma.membro.create({
      data: {
        nome: validated.nome,
        email: validated.email || null,
        telefone: validated.telefone || null,
        whatsapp: validated.whatsapp || null,
        dataNascimento: validated.dataNascimento ? new Date(validated.dataNascimento) : null,
        endereco: validated.endereco || null,
        congregacao: validated.congregacao || null,
        status: validated.status || 'ATIVO',
        observacoes: validated.observacoes || null,
        ministerioId: validated.ministerioId || null,
        departamentoId: validated.departamentoId || null,
      },
    });

    return NextResponse.json(membro, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Dados invalidos', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao criar membro' }, { status: 500 });
  }
}
