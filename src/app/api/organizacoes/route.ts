import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, getUserOrganizations, requireSuperAdmin } from '@/lib/auth-helpers';
import { writeAudit } from '@/lib/audit';

function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function GET() {
  try {
    const user = await requireAuth();
    const orgs = await getUserOrganizations(user.id);
    return NextResponse.json(orgs);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro ao buscar organizações' }, { status: 500 });
  }
}

const criarOrganizacaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  slug: z.string().optional(),
  dominioPersonalizado: z.string().optional(),
  ativo: z.boolean().optional(),
  sitePublico: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();

    const body = await request.json();
    const validated = criarOrganizacaoSchema.parse(body);

    let slug = validated.slug || slugify(validated.nome);
    let counter = 1;
    const baseSlug = slug;
    while (await prisma.organizacao.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const organizacao = await prisma.organizacao.create({
      data: {
        nome: validated.nome,
        descricao: validated.descricao || null,
        slug,
        dominioPersonalizado: validated.dominioPersonalizado || null,
        ativo: validated.ativo ?? true,
        sitePublico: validated.sitePublico ?? true,
      },
    });

    await prisma.configuracoesIgreja.create({
      data: { organizacaoId: organizacao.id },
    });

    await prisma.paginaPublica.create({
      data: {
        organizacaoId: organizacao.id,
        conteudo: {},
        secaoHero: { titulo: 'Bem-vindos à nossa Igreja', subtitulo: 'Uma comunidade de fé, amor e esperança' },
        secaoSobre: { titulo: 'Sobre Nós', texto: 'Somos uma igreja comprometida com o Evangelho.' },
        secaoEventos: { titulo: 'Próximos Eventos', exibir: true },
        secaoLideranca: { titulo: 'Nossa Liderança', exibir: true },
        secaoGaleria: { titulo: 'Galeria', exibir: true },
        secaoContato: { titulo: 'Contato', exibir: true },
        secaoPregacoes: { titulo: 'Pregações Recentes', exibir: true },
      },
    });

    await writeAudit({
      userId: (await requireAuth()).id,
      organizacaoId: organizacao.id,
      acao: 'CRIAR_ORGANIZACAO',
      entidade: 'Organizacao',
      entidadeId: organizacao.id,
      depois: { nome: organizacao.nome, slug: organizacao.slug },
      req: request,
    });

    return NextResponse.json(organizacao, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      const msg = error.issues.map(i => i.message).join('; ');
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao criar organização' }, { status: 500 });
  }
}
