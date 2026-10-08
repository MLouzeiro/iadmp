import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, canAssignRole, canManageOrganization } from '@/lib/auth-helpers';
import { assertTargetUserScope, ORG_FORBIDDEN, orgForbiddenResponse } from '@/lib/tenant';

const editarUsuarioSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  password: z.string().min(6).optional(),
  confirmPassword: z.string().optional(),
  role: z.string().optional(),
  perfilId: z.string().nullable().optional(),
  organizacoes: z.array(z.string()).optional(),
  permissoes: z.record(z.string(), z.boolean()).optional(),
  ativo: z.boolean().optional(),
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) return false;
  return true;
}, { message: 'Senhas não conferem', path: ['confirmPassword'] });

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const requester = await requireAuth();
    const { id } = await params;

    const usuario = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        telefone: true,
        role: true,
        ativo: true,
        createdAt: true,
        perfil: { select: { id: true, nome: true } },
        organizacoes: {
          include: { organizacao: { select: { id: true, nome: true } } },
        },
        permissoes: {
          include: { permissao: true },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    await assertTargetUserScope(requester, id, request);

    const safe = {
      ...usuario,
      passwordHash: undefined,
      perfilId: usuario.perfil?.id || null,
      perfilNome: usuario.perfil?.nome || null,
      organizacoes: usuario.organizacoes.map(uo => ({ id: uo.organizacao.id, nome: uo.organizacao.nome })),
      permissoes: usuario.permissoes.map(up => ({
        modulo: up.permissao.modulo,
        acao: up.permissao.acao,
        concedida: up.concedida,
      })),
    };

    return NextResponse.json(safe);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      if (error.message === ORG_FORBIDDEN) return orgForbiddenResponse();
    }
    return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const requester = await requireAuth();
    const { id } = await params;

    const canEdit = await hasPermission(requester.id, 'Usuarios', 'editar');
    if (!canEdit && requester.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Sem permissão para editar usuários' }, { status: 403 });
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    await assertTargetUserScope(requester, id, request);

    const body = await request.json();
    const validated = editarUsuarioSchema.parse(body);

    if (requester.id === id) {
      const privilegiados = ['role', 'perfilId', 'permissoes', 'organizacoes', 'ativo'] as const;
      const tentouEscalar = privilegiados.some(c => (validated as Record<string, unknown>)[c] !== undefined);
      if (tentouEscalar) {
        return NextResponse.json(
          { error: 'Não e permitido alterar própria permissão, perfil ou organização' },
          { status: 403 }
        );
      }
    }

    if (validated.role && requester.role !== 'SUPER_ADMIN') {
      const allowed = await canAssignRole(requester.id, validated.role);
      if (!allowed) {
        return NextResponse.json({ error: 'Não e permitido atribuir este perfil' }, { status: 403 });
      }
    }

    if (validated.email) {
      const current = await prisma.user.findUnique({ where: { id }, select: { email: true } });
      if (current && validated.email !== current.email) {
        const existing = await prisma.user.findUnique({ where: { email: validated.email } });
        if (existing) {
          return NextResponse.json({ error: 'Este email já esta cadastrado' }, { status: 409 });
        }
      }
    }

    if (validated.organizacoes) {
      for (const orgId of validated.organizacoes) {
        const canManage = await canManageOrganization(requester.id, orgId);
        if (!canManage) {
          return NextResponse.json({ error: 'Você não tem acesso a uma das organizações selecionadas' }, { status: 403 });
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (validated.name) updateData.name = validated.name;
      if (validated.email) updateData.email = validated.email;
      if (validated.telefone !== undefined) updateData.telefone = validated.telefone;
      if (validated.password) updateData.passwordHash = await bcrypt.hash(validated.password, 10);
      if (validated.role) updateData.role = validated.role;
      if (validated.perfilId !== undefined) updateData.perfilId = validated.perfilId || null;
      if (validated.ativo !== undefined) updateData.ativo = validated.ativo;

      const updated = await tx.user.update({ where: { id }, data: updateData });

      if (validated.organizacoes) {
        await tx.usuarioOrganizacao.deleteMany({ where: { userId: id } });
        for (const orgId of validated.organizacoes) {
          await tx.usuarioOrganizacao.create({
            data: { userId: id, organizacaoId: orgId },
          });
        }
      }

      if (validated.permissoes) {
        await tx.usuarioPermissao.deleteMany({ where: { userId: id } });
        const allPerms = await tx.permissao.findMany();
        for (const [permKey, concedida] of Object.entries(validated.permissoes)) {
          const [modulo, acao] = permKey.split(':');
          const perm = allPerms.find(p => p.modulo.toLowerCase() === modulo && p.acao === acao);
          if (perm) {
            await tx.usuarioPermissao.create({
              data: { userId: id, permissaoId: perm.id, concedida },
            });
          }
        }
      }

      await tx.auditLog.create({
        data: {
          userId: requester.id,
          acao: 'EDITAR_USUARIO',
          entidade: 'User',
          entidadeId: id,
          detalhes: { campos: Object.keys(updateData) },
        },
      });

      return updated;
    });

    const { passwordHash: _, ...safeUser } = result;
    return NextResponse.json(safeUser);
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
    return NextResponse.json({ error: 'Erro ao editar usuário' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const requester = await requireAuth();
    const { id } = await params;

    if (requester.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Apenas SUPER_ADMIN pode excluir usuários' }, { status: 403 });
    }

    if (requester.id === id) {
      return NextResponse.json({ error: 'Não e possível excluir seu próprio usuário' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.usuarioPermissao.deleteMany({ where: { userId: id } });
      await tx.usuarioOrganizacao.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          userId: requester.id,
          acao: 'EXCLUIR_USUARIO',
          entidade: 'User',
          entidadeId: id,
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 });
  }
}
