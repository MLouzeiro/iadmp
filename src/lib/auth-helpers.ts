import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as { id: string; email: string; name: string; role: string };
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
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return user?.role === 'SUPER_ADMIN';
}

export async function getUserOrganizations(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return [];

  if (user.role === 'SUPER_ADMIN') {
    return prisma.organizacao.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } });
  }

  const vinculos = await prisma.usuarioOrganizacao.findMany({
    where: { userId },
    include: { organizacao: true },
  });
  return vinculos.map(v => v.organizacao);
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, perfilId: true },
  });
  if (!user) return [];

  if (user.role === 'SUPER_ADMIN') {
    const all = await prisma.permissao.findMany();
    return all.map(p => `${p.modulo.toLowerCase()}:${p.acao}`);
  }

  const permissoesPerfil = user.perfilId
    ? await prisma.perfilPermissao.findMany({
        where: { perfilId: user.perfilId },
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

export async function hasPermission(userId: string, modulo: string, acao: string): Promise<boolean> {
  const perms = await getUserPermissions(userId);
  return perms.includes(`${modulo.toLowerCase()}:${acao}`);
}

export async function canManageOrganization(userId: string, organizacaoId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;

  const vinculo = await prisma.usuarioOrganizacao.findUnique({
    where: { userId_organizacaoId: { userId, organizacaoId } },
  });
  return !!vinculo;
}

export async function canAssignRole(requesterId: string, targetRole: string): Promise<boolean> {
  const requester = await prisma.user.findUnique({ where: { id: requesterId }, select: { role: true } });
  if (!requester) return false;

  if (requester.role === 'SUPER_ADMIN') return true;

  const hierarchy: Record<string, number> = {
    SUPER_ADMIN: 100,
    ADMIN_IGREJA: 80,
    LIDER: 60,
    COORDENADOR: 40,
    MUSICO: 20,
    MEMBER: 10,
    ADMIN: 90,
    PASTOR: 85,
    SECRETARIA: 50,
    FINANCEIRO: 50,
    LIDER_MINISTERIO: 60,
    EDITOR_SITE: 50,
  };

  const requesterLevel = hierarchy[requester.role] ?? 0;
  const targetLevel = hierarchy[targetRole] ?? 0;

  return requesterLevel > targetLevel;
}
