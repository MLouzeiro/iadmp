import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, canAssignRole, canManageOrganization } from '@/lib/auth-helpers';
import { assertOrgAccess, resolveOrgScope, orgFilter, ORG_FORBIDDEN, orgForbiddenResponse } from '@/lib/tenant';

const criarUsuarioSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().nullable().optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
  role: z.string().min(1, 'Perfil é obrigatório'),
  perfilId: z.string().optional(),
  organizacoes: z.array(z.string()).min(1, 'Selecione pelo menos uma organização'),
  permissoes: z.record(z.string(), z.boolean()).optional(),
  ativo: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const organizacaoId = searchParams.get('organizacaoId') || '';
    const ativo = searchParams.get('ativo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (ativo !== null && ativo !== undefined && ativo !== '') {
      where.ativo = ativo === 'true';
    }

    if (organizacaoId) {
      await assertOrgAccess(user.id, organizacaoId, request);
      where.organizacoes = { some: { organizacaoId } };
    } else {
      const scope = await resolveOrgScope(user);
      if (scope.mode !== 'ALL') {
        where.organizacoes = { some: { organizacaoId: { in: scope.orgIds } } };
      }
    }

    const [usuarios, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          telefone: true,
          role: true,
          ativo: true,
          createdAt: true,
          perfil: { select: { nome: true } },
          organizacoes: {
            include: { organizacao: { select: { id: true, nome: true } } },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const safe = usuarios.map(u => ({
      ...u,
      passwordHash: undefined,
      perfilNome: u.perfil?.nome || null,
      organizacoes: u.organizacoes.map(uo => ({
        id: uo.organizacao.id,
        nome: uo.organizacao.nome,
      })),
    }));

    return NextResponse.json({ usuarios: safe, total, page, limit });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      if (error.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    }
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const requester = await requireAuth();

    const canCreate = await hasPermission(requester.id, 'Usuarios', 'criar');
    if (!canCreate && requester.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Sem permissão para criar usuários' }, { status: 403 });
    }

    const body = await request.json();
    const validated = criarUsuarioSchema.parse(body);

    if (requester.role !== 'SUPER_ADMIN') {
      const allowed = await canAssignRole(requester.id, validated.role);
      if (!allowed) {
        return NextResponse.json({ error: 'Não e permitido atribuir este perfil' }, { status: 403 });
      }
    }

    const existing = await prisma.user.findUnique({ where: { email: validated.email } });
    if (existing) {
      return NextResponse.json({ error: 'Este email já esta cadastrado' }, { status: 409 });
    }

    for (const orgId of validated.organizacoes) {
      const canManage = await canManageOrganization(requester.id, orgId);
      if (!canManage) {
        return NextResponse.json({ error: 'Você não tem acesso a uma das organizações selecionadas' }, { status: 403 });
      }
    }

    const orgsAreValid = await prisma.organizacao.findMany({
      where: { id: { in: validated.organizacoes }, ativo: true },
    });
    if (orgsAreValid.length !== validated.organizacoes.length) {
      return NextResponse.json({ error: 'Uma ou mais organizações inválidas' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: validated.name,
          email: validated.email,
          telefone: validated.telefone || null,
          passwordHash,
          role: validated.role as any,
          perfilId: validated.perfilId || null,
          ativo: validated.ativo !== undefined ? validated.ativo : true,
        },
      });

      for (const orgId of validated.organizacoes) {
        await tx.usuarioOrganizacao.create({
          data: { userId: newUser.id, organizacaoId: orgId },
        });
      }

      if (validated.permissoes) {
        const allPerms = await tx.permissao.findMany();
        for (const [permKey, concedida] of Object.entries(validated.permissoes)) {
          const [modulo, acao] = permKey.split(':');
          const perm = allPerms.find(p => p.modulo.toLowerCase() === modulo && p.acao === acao);
          if (perm) {
            await tx.usuarioPermissao.create({
              data: { userId: newUser.id, permissaoId: perm.id, concedida },
            });
          }
        }
      }

      await tx.auditLog.create({
        data: {
          userId: requester.id,
          acao: 'CRIAR_USUARIO',
          entidade: 'User',
          entidadeId: newUser.id,
          detalhes: { nome: newUser.name, email: newUser.email, role: newUser.role },
        },
      });

      return newUser;
    });

    const { passwordHash: _, ...safeUser } = result;
    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const issues = JSON.parse(error.message);
      const msg = issues.map((i: any) => i.message).join('; ');
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      if (error.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    }
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}
