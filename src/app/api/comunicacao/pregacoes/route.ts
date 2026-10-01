import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const organizacaoId = searchParams.get('organizacaoId');
    const status = searchParams.get('status');
    const busca = searchParams.get('busca');
    const tipo = searchParams.get('tipo');
    const pregador = searchParams.get('pregador');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const ordenar = searchParams.get('ordenar') || 'recentes';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (organizacaoId) {
      const podeVer = await canManageOrganization(user.id, organizacaoId);
      if (!podeVer) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });
      where.organizacaoId = organizacaoId;
    }
    if (status) where.status = status;
    if (tipo) where.tipo = tipo;
    if (pregador) where.pregadorNome = { contains: pregador, mode: 'insensitive' };

    if (!organizacaoId && user.role !== 'SUPER_ADMIN') {
      const vinculos = await prisma.usuarioOrganizacao.findMany({
        where: { userId: user.id },
        select: { organizacaoId: true },
      });
      where.organizacaoId = { in: vinculos.map(v => v.organizacaoId) };
    }

    if (busca) {
      const orConditions: Record<string, unknown>[] = [
        { titulo: { contains: busca, mode: 'insensitive' } },
        { tema: { contains: busca, mode: 'insensitive' } },
        { pregadorNome: { contains: busca, mode: 'insensitive' } },
        { referenciaLivro: { contains: busca, mode: 'insensitive' } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: orConditions }];
        delete where.OR;
      } else {
        where.OR = orConditions;
      }
    }

    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data = { ...(where.data as Record<string, unknown>), gte: new Date(dataInicio) };
      if (dataFim) where.data = { ...(where.data as Record<string, unknown>), lte: new Date(dataFim) };
    }

    let orderBy: Record<string, string>;
    switch (ordenar) {
      case 'antigas': orderBy = { data: 'asc' }; break;
      case 'titulo': orderBy = { titulo: 'asc' }; break;
      default: orderBy = { data: 'desc' };
    }

    const [pregacoes, total] = await Promise.all([
      prisma.pregacao.findMany({
        where,
        include: {
          organizacao: { select: { id: true, nome: true } },
          liturgia: { select: { id: true, tema: true, data: true, horarioInicio: true, tipoCulto: true } },
          pregador: { select: { id: true, name: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pregacao.count({ where }),
    ]);

    return NextResponse.json({ pregacoes, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    console.error('GET /api/comunicacao/pregacoes error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const hasPerm = await hasPermission(user.id, 'pregacoes', 'criar');
    if (!hasPerm) return NextResponse.json({ error: 'Sem permissao para criar pregacoes' }, { status: 403 });

    const body = await request.json();
    const {
      organizacaoId, liturgiaId, titulo, descricao, tema, tipo, pregadorId, pregadorNome,
      data, referenciaLivro, referenciaCapitulo, referenciaVersIni, referenciaVersFim,
      videoUrl, capaUrl, observacoes, status, destaque
    } = body;

    if (!organizacaoId || !titulo || !data) {
      return NextResponse.json({ error: 'organizacaoId, titulo e data sao obrigatorios' }, { status: 400 });
    }

    const canManage = await canManageOrganization(user.id, organizacaoId);
    if (!canManage) return NextResponse.json({ error: 'Sem permissao para esta organizacao' }, { status: 403 });

    if (videoUrl) {
      try {
        new URL(videoUrl);
      } catch {
        return NextResponse.json({ error: 'URL do video invalida' }, { status: 400 });
      }
      if (videoUrl.startsWith('javascript:') || videoUrl.startsWith('data:')) {
        return NextResponse.json({ error: 'URL contem esquema nao permitido' }, { status: 400 });
      }
    }

    if (capaUrl) {
      try {
        new URL(capaUrl);
      } catch {
        return NextResponse.json({ error: 'URL da capa invalida' }, { status: 400 });
      }
    }

    if (liturgiaId) {
      const liturgia = await prisma.liturgia.findUnique({ where: { id: liturgiaId } });
      if (!liturgia) return NextResponse.json({ error: 'Liturgia nao encontrada' }, { status: 404 });
      const existingPregacao = await prisma.pregacao.findUnique({ where: { liturgiaId } });
      if (existingPregacao) return NextResponse.json({ error: 'Esta liturgia ja possui uma pregacao vinculada' }, { status: 400 });
    }

    let baseSlug = slugify(titulo);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.pregacao.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const pregacao = await prisma.pregacao.create({
      data: {
        organizacaoId,
        liturgiaId: liturgiaId || null,
        titulo,
        slug,
        descricao: descricao || null,
        tema: tema || null,
        tipo: tipo || 'Pregacao',
        pregadorId: pregadorId || null,
        pregadorNome: pregadorNome || null,
        data: new Date(data),
        referenciaLivro: referenciaLivro || null,
        referenciaCapitulo: referenciaCapitulo || null,
        referenciaVersIni: referenciaVersIni || null,
        referenciaVersFim: referenciaVersFim || null,
        videoUrl: videoUrl || null,
        capaUrl: capaUrl || null,
        observacoes: observacoes || null,
        status: status || 'RASCUNHO',
        destaque: destaque || false,
        createdById: user.id,
        updatedById: user.id,
      },
      include: {
        organizacao: { select: { id: true, nome: true } },
        liturgia: { select: { id: true, tema: true, data: true, horarioInicio: true, tipoCulto: true } },
        pregador: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ pregacao }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    console.error('POST /api/comunicacao/pregacoes error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
