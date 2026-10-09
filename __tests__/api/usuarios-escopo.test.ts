/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as usuariosGET, POST as usuariosPOST } from '@/app/api/usuarios/route';
import { GET as usuarioGET, PUT as usuarioPUT } from '@/app/api/usuarios/[id]/route';
import { PATCH as statusPATCH } from '@/app/api/usuarios/[id]/status/route';
import { requireAuth, hasPermission, canAssignRole, canManageOrganization } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: 'novo' }),
      update: jest.fn().mockResolvedValue({ id: 'id1' }),
    },
    usuarioOrganizacao: {
      findMany: jest.fn().mockResolvedValue([{ organizacaoId: 'org-a' }]),
      findUnique: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
    },
    usuarioPermissao: {
      deleteMany: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
    },
    permissao: { findMany: jest.fn().mockResolvedValue([]) },
    organizacao: { findMany: jest.fn().mockResolvedValue([{ id: 'org-a' }]) },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/auth-helpers', () => ({
  requireAuth: jest.fn(),
  requireSuperAdmin: jest.fn(),
  hasPermission: jest.fn(),
  canAssignRole: jest.fn(),
  canManageOrganization: jest.fn(),
  getUserPermissions: jest.fn().mockResolvedValue([]),
  getUserOrganizations: jest.fn().mockResolvedValue([]),
}));

const mockAuth = requireAuth as jest.Mock;
const mockPerm = hasPermission as jest.Mock;
const mockAssign = canAssignRole as jest.Mock;
const mockCan = canManageOrganization as jest.Mock;
const mockUserFindMany = prisma.user.findMany as jest.Mock;
const mockUserFindUnique = prisma.user.findUnique as jest.Mock;

function jsonRequest(url: string, method: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function idParams(id = 'id1') {
  return { params: Promise.resolve({ id }) };
}

const ORG403 = { error: 'Sem permissão para esta organização' };

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ id: 'u1', email: 'a@a.com', name: 'User', role: 'ADMIN_IGREJA' });
  mockPerm.mockResolvedValue(true);
  mockAssign.mockResolvedValue(true);
  mockCan.mockResolvedValue(true);
});

describe('vazamento de ?organizacaoId= em /api/usuarios', () => {
  it('organizacaoId alheio retorna 403', async () => {
    mockCan.mockResolvedValue(false);
    const res = await usuariosGET(
      new NextRequest('http://localhost/api/usuarios?organizacaoId=org-outra')
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
    expect(mockUserFindMany).not.toHaveBeenCalled();
  });

  it('organizacaoId propria filtra por ela', async () => {
    const res = await usuariosGET(
      new NextRequest('http://localhost/api/usuarios?organizacaoId=org-a')
    );
    expect(res.status).toBe(200);
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizacoes: { some: { organizacaoId: 'org-a' } },
        }),
      })
    );
  });

  it('sem organizacaoId restringe aos vinculos do requisitante', async () => {
    const res = await usuariosGET(new NextRequest('http://localhost/api/usuarios'));
    expect(res.status).toBe(200);
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizacoes: { some: { organizacaoId: { in: ['org-a'] } } },
        }),
      })
    );
  });
});

describe('autoedição de privilegios em /api/usuarios/[id]', () => {
  beforeEach(() => {
    mockUserFindUnique.mockResolvedValue({
      id: 'u1',
      role: 'ADMIN_IGREJA',
      organizacoes: [{ organizacaoId: 'org-a' }],
    });
  });

  it('nao permite alterar o proprio role', async () => {
    const res = await usuarioPUT(
      jsonRequest('http://localhost/api/usuarios/u1', 'PUT', { role: 'SUPER_ADMIN' }),
      idParams('u1')
    );
    expect(res.status).toBe(403);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('nao permite conceder permissoes a si mesmo', async () => {
    const res = await usuarioPUT(
      jsonRequest('http://localhost/api/usuarios/u1', 'PUT', { permissoes: { 'usuarios:excluir': true } }),
      idParams('u1')
    );
    expect(res.status).toBe(403);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('nao permite alterar as proprias organizacoes', async () => {
    const res = await usuarioPUT(
      jsonRequest('http://localhost/api/usuarios/u1', 'PUT', { organizacoes: ['org-a', 'org-b'] }),
      idParams('u1')
    );
    expect(res.status).toBe(403);
  });

  it('permite editar perfil proprio comum (nome)', async () => {
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) =>
      fn({
        user: { update: jest.fn().mockResolvedValue({ id: 'u1', name: 'Novo Nome' }) },
        usuarioOrganizacao: { deleteMany: jest.fn(), create: jest.fn() },
        usuarioPermissao: { deleteMany: jest.fn(), create: jest.fn() },
        permissao: { findMany: jest.fn().mockResolvedValue([]) },
        auditLog: { create: jest.fn() },
      })
    );
    const res = await usuarioPUT(
      jsonRequest('http://localhost/api/usuarios/u1', 'PUT', { name: 'Novo Nome' }),
      idParams('u1')
    );
    expect(res.status).toBe(200);
  });

  it('alvo fora do escopo de organizacao retorna 403', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'alvo',
      role: 'MEMBER',
      organizacoes: [{ organizacaoId: 'org-outra' }],
    });
    (prisma.usuarioOrganizacao.findMany as jest.Mock).mockResolvedValue([
      { organizacaoId: 'org-a' },
    ]);
    const res = await usuarioPUT(
      jsonRequest('http://localhost/api/usuarios/alvo', 'PUT', { name: 'X' }),
      idParams('alvo')
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

describe('/api/usuarios/[id]/status respeita escopo', () => {
  it('nao desativa usuario de outra organizacao', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'alvo',
      role: 'MEMBER',
      organizacoes: [{ organizacaoId: 'org-outra' }],
    });
    (prisma.usuarioOrganizacao.findMany as jest.Mock).mockResolvedValue([
      { organizacaoId: 'org-a' },
    ]);
    const res = await statusPATCH(
      jsonRequest('http://localhost/api/usuarios/alvo/status', 'PATCH', { ativo: false }),
      idParams('alvo')
    );
    expect(res.status).toBe(403);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('nao permite auto-desativacao', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'u1',
      role: 'ADMIN_IGREJA',
      organizacoes: [{ organizacaoId: 'org-a' }],
    });
    const res = await statusPATCH(
      jsonRequest('http://localhost/api/usuarios/u1/status', 'PATCH', { ativo: false }),
      idParams('u1')
    );
    expect(res.status).toBe(400);
  });
});

describe('POST /api/usuarios valida organizacoes do corpo', () => {
  beforeEach(() => {
    mockUserFindUnique.mockResolvedValue(null);
  });

  it('recusa organizacao fora do escopo do requisitante', async () => {
    mockCan.mockResolvedValue(false);
    const res = await usuariosPOST(
      jsonRequest('http://localhost/api/usuarios', 'POST', {
        name: 'Novo',
        email: 'novo@a.com',
        password: '123456',
        confirmPassword: '123456',
        role: 'MEMBER',
        organizacoes: ['org-outra'],
      })
    );
    expect(res.status).toBe(403);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('nao permite atribuir role acima do proprio nivel', async () => {
    mockAuth.mockResolvedValue({ id: 'u1', email: 'a@a.com', name: 'User', role: 'SECRETARIA' });
    mockAssign.mockResolvedValue(false);
    const res = await usuariosPOST(
      jsonRequest('http://localhost/api/usuarios', 'POST', {
        name: 'Novo',
        email: 'novo@a.com',
        password: '123456',
        confirmPassword: '123456',
        role: 'ADMIN_IGREJA',
        organizacoes: ['org-a'],
      })
    );
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/usuarios/[id] aceita telefone null', () => {
  beforeEach(() => {
    mockUserFindUnique.mockResolvedValue({
      id: 'alvo',
      role: 'MEMBER',
      email: 'alvo@a.com',
      organizacoes: [{ organizacaoId: 'org-a' }],
    });
  });

  it('salva telefone null sem retornar 400', async () => {
    const mockTx = {
      user: { update: jest.fn().mockResolvedValue({ id: 'alvo', name: 'Alvo', telefone: null }) },
      usuarioOrganizacao: { deleteMany: jest.fn(), create: jest.fn() },
      usuarioPermissao: { deleteMany: jest.fn(), create: jest.fn() },
      permissao: { findMany: jest.fn().mockResolvedValue([]) },
      auditLog: { create: jest.fn() },
    };
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => fn(mockTx));

    const res = await usuarioPUT(
      jsonRequest('http://localhost/api/usuarios/alvo', 'PUT', { telefone: null }),
      idParams('alvo')
    );
    expect(res.status).toBe(200);
    expect(mockTx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ telefone: null }),
      })
    );
  });
});
