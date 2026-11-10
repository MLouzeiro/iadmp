import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canAssignRoleByLevel } from '@/lib/roles';

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as {
    id: string;
    email: string;
    name: string;
    role: string;
    ativo?: boolean;
  };
  if (user.ativo === false) return null;
  return user;
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireAuth();
  if (user.role !== 'SUPER_ADMIN') throw new Error('FORBIDDEN');
  return user;
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, ativo: true },
  });
  return !!user?.ativo && user.role === 'SUPER_ADMIN';
}

export async function getUserOrganizations(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, ativo: true },
  });
  if (!user || !user.ativo) return [];

  if (user.role === 'SUPER_ADMIN') {
    return prisma.organizacao.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } });
  }

  const vinculos = await prisma.usuarioOrganizacao.findMany({
    where: { userId, ativo: true, organizacao: { ativo: true } },
    include: { organizacao: true },
  });
  return vinculos.map(v => v.organizacao);
}

/**
 * Permissoes efetivas do usuario.
 * - SUPER_ADMIN recebe todas as permissoes cadastradas.
 * - Demais: uniao do perfil global (`User.perfilId`) com os perfis dos
 *   vinculos ativos (`UsuarioOrganizacao.perfilId`). Quando `organizacaoId`
 *   e informado, apenas o perfil daquele vinculo e considerado.
 * - Permissoes individuais (`UsuarioPermissao`) concedem ou revogam por cima.
 */
export async function getUserPermissions(userId: string, organizacaoId?: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, ativo: true, perfilId: true },
  });
  if (!user || !user.ativo) return [];

  if (user.role === 'SUPER_ADMIN') {
    const all = await prisma.permissao.findMany();
    return all.map(p => `${p.modulo.toLowerCase()}:${p.acao}`);
  }

  const perfilIds = new Set<string>();
  if (user.perfilId) perfilIds.add(user.perfilId);

  const vinculos = await prisma.usuarioOrganizacao.findMany({
    where: {
      userId,
      ativo: true,
      organizacao: { ativo: true },
      ...(organizacaoId ? { organizacaoId } : {}),
      perfilId: { not: null },
    },
    select: { perfilId: true },
  });
  for (const vinculo of vinculos) {
    if (vinculo.perfilId) perfilIds.add(vinculo.perfilId);
  }

  const permissoesPerfil = perfilIds.size
    ? await prisma.perfilPermissao.findMany({
        where: { perfilId: { in: Array.from(perfilIds) } },
        include: { permissao: true },
      })
    : [];

  const base = permissoesPerfil.map(pp => `${pp.permissao.modulo.toLowerCase()}:${pp.permissao.acao}`);

  const customPerms = await prisma.usuarioPermissao.findMany({
    where: { userId },
    include: { permissao: true },
  });

  const permSet = new Set(base);
  for (const cp of customPerms) {
    const key = `${cp.permissao.modulo.toLowerCase()}:${cp.permissao.acao}`;
    if (cp.concedida) permSet.add(key);
    else permSet.delete(key);
  }

  return Array.from(permSet);
}

export async function hasPermission(
  userId: string,
  modulo: string,
  acao: string,
  organizacaoId?: string
): Promise<boolean> {
  const perms = await getUserPermissions(userId, organizacaoId);
  return perms.includes(`${modulo.toLowerCase()}:${acao}`);
}

export async function canManageOrganization(userId: string, organizacaoId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, ativo: true },
  });
  if (!user || !user.ativo) return false;
  if (user.role === 'SUPER_ADMIN') return true;

  const vinculo = await prisma.usuarioOrganizacao.findFirst({
    where: {
      userId,
      organizacaoId,
      ativo: true,
      organizacao: { ativo: true },
    },
  });
  return !!vinculo;
}

export async function canAssignRole(requesterId: string, targetRole: string): Promise<boolean> {
  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { role: true, ativo: true },
  });
  if (!requester || !requester.ativo) return false;

  if (requester.role === 'SUPER_ADMIN') return true;

  return canAssignRoleByLevel(requester.role, targetRole);
}
