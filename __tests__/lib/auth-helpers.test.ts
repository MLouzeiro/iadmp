/**
 * @jest-environment node
 */
import {
  getSessionUser,
  getUserOrganizations,
  getUserPermissions,
  hasPermission,
  canManageOrganization,
  canAssignRole,
} from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    usuarioOrganizacao: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    usuarioPermissao: { findMany: jest.fn() },
    perfilPermissao: { findMany: jest.fn() },
    permissao: { findMany: jest.fn() },
    organizacao: { findMany: jest.fn() },
  },
}));

const mockAuth = auth as jest.Mock;
const mockUser = prisma.user.findUnique as jest.Mock;
const mockVinculos = prisma.usuarioOrganizacao.findMany as jest.Mock;
const mockVinculo = prisma.usuarioOrganizacao.findFirst as jest.Mock;
const mockPerfilPerm = prisma.perfilPermissao.findMany as jest.Mock;
const mockUserPerm = prisma.usuarioPermissao.findMany as jest.Mock;
const mockPermissao = prisma.permissao.findMany as jest.Mock;
const mockOrgs = prisma.organizacao.findMany as jest.Mock;

const perm = (modulo: string, acao: string) => ({ permissao: { modulo, acao } });

beforeEach(() => {
  jest.resetAllMocks();
  mockUserPerm.mockResolvedValue([]);
  mockPerfilPerm.mockResolvedValue([]);
  mockVinculos.mockResolvedValue([]);
});

describe('getSessionUser', () => {
  it('retorna null sem sessao', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getSessionUser()).resolves.toBeNull();
  });

  it('retorna null quando o usuario da sessao esta inativo', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'MEMBER', ativo: false } });
    await expect(getSessionUser()).resolves.toBeNull();
  });

  it('retorna o usuario quando ativo', async () => {
    const user = { id: 'u1', email: 'a@b.c', name: 'A', role: 'MEMBER', ativo: true };
    mockAuth.mockResolvedValue({ user });
    await expect(getSessionUser()).resolves.toEqual(user);
  });
});

describe('getUserPermissions', () => {
  it('usuario inexistente ou inativo nao tem permissoes', async () => {
    mockUser.mockResolvedValue(null);
    await expect(getUserPermissions('u1')).resolves.toEqual([]);

    mockUser.mockResolvedValue({ role: 'MEMBER', ativo: false, perfilId: null });
    await expect(getUserPermissions('u1')).resolves.toEqual([]);
  });

  it('SUPER_ADMIN recebe todas as permissoes normalizadas', async () => {
    mockUser.mockResolvedValue({ role: 'SUPER_ADMIN', ativo: true, perfilId: null });
    mockPermissao.mockResolvedValue([
      { modulo: 'Usuarios', acao: 'criar' },
      { modulo: 'Membros', acao: 'visualizar' },
    ]);

    await expect(getUserPermissions('u1')).resolves.toEqual([
      'usuarios:criar',
      'membros:visualizar',
    ]);
  });

  it('une perfil global e perfis dos vinculos ativos', async () => {
    mockUser.mockResolvedValue({ role: 'LIDER', ativo: true, perfilId: 'p-global' });
    mockVinculos.mockResolvedValue([{ perfilId: 'p-org-a' }, { perfilId: null }]);
    mockPerfilPerm.mockResolvedValue([
      perm('Membros', 'visualizar'),
      perm('Eventos', 'criar'),
    ]);

    const perms = await getUserPermissions('u1');

    expect(mockPerfilPerm).toHaveBeenCalledWith({
      where: { perfilId: { in: expect.arrayContaining(['p-global', 'p-org-a']) } },
      include: { permissao: true },
    });
    expect(new Set(perms)).toEqual(new Set(['membros:visualizar', 'eventos:criar']));
  });

  it('quando organizacaoId e informado, considera somente o perfil daquele vinculo', async () => {
    mockUser.mockResolvedValue({ role: 'LIDER', ativo: true, perfilId: 'p-global' });
    mockVinculos.mockResolvedValue([{ perfilId: 'p-org-a' }]);

    await getUserPermissions('u1', 'org-a');

    expect(mockVinculos).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'u1',
          ativo: true,
          organizacaoId: 'org-a',
        }),
      })
    );
  });

  it('permissoes customizadas concedem e revogam', async () => {
    mockUser.mockResolvedValue({ role: 'MEMBER', ativo: true, perfilId: 'p1' });
    mockPerfilPerm.mockResolvedValue([
      perm('Membros', 'visualizar'),
      perm('Eventos', 'visualizar'),
    ]);
    mockUserPerm.mockResolvedValue([
      { concedida: false, permissao: { modulo: 'Membros', acao: 'visualizar' } },
      { concedida: true, permissao: { modulo: 'Financeiro', acao: 'visualizar' } },
    ]);

    const perms = await getUserPermissions('u1');

    expect(perms).not.toContain('membros:visualizar');
    expect(perms).toEqual(expect.arrayContaining(['eventos:visualizar', 'financeiro:visualizar']));
  });
});

describe('hasPermission', () => {
  it('normaliza o modulo para minusculas', async () => {
    mockUser.mockResolvedValue({ role: 'MEMBER', ativo: true, perfilId: 'p1' });
    mockPerfilPerm.mockResolvedValue([perm('Usuarios', 'criar')]);

    await expect(hasPermission('u1', 'Usuarios', 'criar')).resolves.toBe(true);
    await expect(hasPermission('u1', 'usuarios', 'excluir')).resolves.toBe(false);
  });
});

describe('canManageOrganization', () => {
  it('nega usuario inativo ou inexistente', async () => {
    mockUser.mockResolvedValue(null);
    await expect(canManageOrganization('u1', 'org-a')).resolves.toBe(false);

    mockUser.mockResolvedValue({ role: 'ADMIN_IGREJA', ativo: false });
    await expect(canManageOrganization('u1', 'org-a')).resolves.toBe(false);
  });

  it('SUPER_ADMIN gerencia qualquer organizacao', async () => {
    mockUser.mockResolvedValue({ role: 'SUPER_ADMIN', ativo: true });
    await expect(canManageOrganization('u1', 'org-x')).resolves.toBe(true);
    expect(mockVinculo).not.toHaveBeenCalled();
  });

  it('exige vinculo ativo com organizacao ativa', async () => {
    mockUser.mockResolvedValue({ role: 'PASTOR', ativo: true });
    mockVinculo.mockResolvedValue({ id: 'v1' });

    await expect(canManageOrganization('u1', 'org-a')).resolves.toBe(true);
    expect(mockVinculo).toHaveBeenCalledWith({
      where: {
        userId: 'u1',
        organizacaoId: 'org-a',
        ativo: true,
        organizacao: { ativo: true },
      },
    });

    mockVinculo.mockResolvedValue(null);
    await expect(canManageOrganization('u1', 'org-a')).resolves.toBe(false);
  });
});

describe('canAssignRole', () => {
  it('nega requisitante inativo ou inexistente', async () => {
    mockUser.mockResolvedValue(null);
    await expect(canAssignRole('u1', 'MEMBER')).resolves.toBe(false);

    mockUser.mockResolvedValue({ role: 'ADMIN_IGREJA', ativo: false });
    await expect(canAssignRole('u1', 'MEMBER')).resolves.toBe(false);
  });

  it('SUPER_ADMIN atribui qualquer role', async () => {
    mockUser.mockResolvedValue({ role: 'SUPER_ADMIN', ativo: true });
    await expect(canAssignRole('u1', 'ADMIN_IGREJA')).resolves.toBe(true);
  });

  it('so permite atribuir role de nivel inferior', async () => {
    mockUser.mockResolvedValue({ role: 'ADMIN_IGREJA', ativo: true });
    await expect(canAssignRole('u1', 'PASTOR')).resolves.toBe(true);
    await expect(canAssignRole('u1', 'ADMIN_IGREJA')).resolves.toBe(false);
    await expect(canAssignRole('u1', 'SUPER_ADMIN')).resolves.toBe(false);
  });

  it('roles de mesmo nivel nao se atribuem', async () => {
    mockUser.mockResolvedValue({ role: 'LIDER', ativo: true });
    await expect(canAssignRole('u1', 'COORDENADOR')).resolves.toBe(false);
    await expect(canAssignRole('u1', 'MUSICO')).resolves.toBe(true);
  });

  it('role de destino desconhecida e negada', async () => {
    mockUser.mockResolvedValue({ role: 'ADMIN_IGREJA', ativo: true });
    await expect(canAssignRole('u1', 'ROLE_INEXISTENTE')).resolves.toBe(false);
  });
});

describe('getUserOrganizations', () => {
  it('usuario inativo nao tem organizacoes', async () => {
    mockUser.mockResolvedValue({ role: 'MEMBER', ativo: false });
    await expect(getUserOrganizations('u1')).resolves.toEqual([]);
  });

  it('SUPER_ADMIN lista organizacoes ativas', async () => {
    mockUser.mockResolvedValue({ role: 'SUPER_ADMIN', ativo: true });
    mockOrgs.mockResolvedValue([{ id: 'org-a' }]);

    await expect(getUserOrganizations('u1')).resolves.toEqual([{ id: 'org-a' }]);
    expect(mockOrgs).toHaveBeenCalledWith({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });
  });

  it('demais usuarios so recebem vinculos ativos de organizacoes ativas', async () => {
    mockUser.mockResolvedValue({ role: 'LIDER', ativo: true });
    mockVinculos.mockResolvedValue([{ organizacao: { id: 'org-a' } }]);

    await expect(getUserOrganizations('u1')).resolves.toEqual([{ id: 'org-a' }]);
    expect(mockVinculos).toHaveBeenCalledWith({
      where: { userId: 'u1', ativo: true, organizacao: { ativo: true } },
      include: { organizacao: true },
    });
  });
});
