/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as bannersGET, POST as bannersPOST } from '@/app/api/banners/route';
import { PUT as bannerPUT, DELETE as bannerDELETE } from '@/app/api/banners/[id]/route';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    banner: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'b1', imagemUrl: '/images/x.jpg' }),
      update: jest.fn().mockResolvedValue({ id: 'b1' }),
      delete: jest.fn().mockResolvedValue({}),
    },
    organizacao: {
      findMany: jest.fn().mockResolvedValue([{ id: 'org-a' }]),
    },
    usuarioOrganizacao: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  },
}));

jest.mock('@/lib/auth-helpers', () => ({
  requireAuth: jest.fn(),
  hasPermission: jest.fn().mockResolvedValue(true),
  canManageOrganization: jest.fn().mockResolvedValue(true),
  requireSuperAdmin: jest.fn(),
  getSessionUser: jest.fn(),
  getUserPermissions: jest.fn().mockResolvedValue([]),
  getUserOrganizations: jest.fn().mockResolvedValue([]),
}));

const mockAuth = requireAuth as jest.Mock;
const mockHasPermission = hasPermission as jest.Mock;
const mockCanManage = canManageOrganization as jest.Mock;

function jsonRequest(url: string, method: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function idParams(id = 'b1') {
  return { params: Promise.resolve({ id }) };
}

const UNAUTH = () => Promise.reject(new Error('UNAUTHORIZED'));

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ id: 'u1', email: 'a@a.com', name: 'User', role: 'SUPER_ADMIN' });
  mockHasPermission.mockResolvedValue(true);
  mockCanManage.mockResolvedValue(true);
});

describe('GET /api/banners', () => {
  it('retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await bannersGET(new NextRequest('http://localhost/api/banners'));
    expect(res.status).toBe(401);
  });

  it('retorna 403 sem permissao do modulo banners', async () => {
    mockHasPermission.mockResolvedValue(false);
    const res = await bannersGET(new NextRequest('http://localhost/api/banners'));
    expect(res.status).toBe(403);
    expect(mockHasPermission).toHaveBeenCalledWith('u1', 'banners', 'visualizar');
  });

  it('retorna 200 com sessao e permissao', async () => {
    const res = await bannersGET(new NextRequest('http://localhost/api/banners'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});

describe('POST /api/banners', () => {
  it('retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await bannersPOST(
      jsonRequest('http://localhost/api/banners', 'POST', { imagemUrl: '/images/x.jpg' })
    );
    expect(res.status).toBe(401);
  });

  it('retorna 403 sem permissao de criar', async () => {
    mockHasPermission.mockResolvedValue(false);
    const res = await bannersPOST(
      jsonRequest('http://localhost/api/banners', 'POST', { imagemUrl: '/images/x.jpg' })
    );
    expect(res.status).toBe(403);
    expect(mockHasPermission).toHaveBeenCalledWith('u1', 'banners', 'criar');
  });

  it('cria banner valido com 201 e audita', async () => {
    const res = await bannersPOST(
      jsonRequest('http://localhost/api/banners', 'POST', {
        titulo: 'Flyer Culto',
        imagemUrl: '/images/flyer.jpg',
        tipo: 'FLYER',
        ordem: 2,
      })
    );
    expect(res.status).toBe(201);
    expect(prisma.banner.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizacaoId: 'org-a',
          titulo: 'Flyer Culto',
          tipo: 'FLYER',
          ordem: 2,
          ativo: true,
        }),
      })
    );
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('retorna 400 para dados invalidos (sem imagemUrl)', async () => {
    const res = await bannersPOST(
      jsonRequest('http://localhost/api/banners', 'POST', { titulo: 'Sem imagem' })
    );
    expect(res.status).toBe(400);
    expect(prisma.banner.create).not.toHaveBeenCalled();
  });
});

describe('PUT /api/banners/[id]', () => {
  it('retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await bannerPUT(
      jsonRequest('http://localhost/api/banners/b1', 'PUT', { titulo: 'Novo' }),
      idParams()
    );
    expect(res.status).toBe(401);
  });

  it('retorna 403 sem permissao de editar', async () => {
    mockHasPermission.mockResolvedValue(false);
    const res = await bannerPUT(
      jsonRequest('http://localhost/api/banners/b1', 'PUT', { titulo: 'Novo' }),
      idParams()
    );
    expect(res.status).toBe(403);
    expect(mockHasPermission).toHaveBeenCalledWith('u1', 'banners', 'editar');
  });

  it('retorna 404 quando o banner nao existe', async () => {
    (prisma.banner.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const res = await bannerPUT(
      jsonRequest('http://localhost/api/banners/b1', 'PUT', { titulo: 'Novo' }),
      idParams('inexistente')
    );
    expect(res.status).toBe(404);
    expect(prisma.banner.update).not.toHaveBeenCalled();
  });

  it('atualiza apenas os campos enviados', async () => {
    (prisma.banner.findUnique as jest.Mock).mockResolvedValue({
      id: 'b1',
      organizacaoId: 'org-a',
      titulo: 'Antigo',
    });
    const res = await bannerPUT(
      jsonRequest('http://localhost/api/banners/b1', 'PUT', { titulo: 'Novo', ativo: false }),
      idParams()
    );
    expect(res.status).toBe(200);
    expect(prisma.banner.update).toHaveBeenCalledWith({
      where: { id: 'b1' },
      data: { titulo: 'Novo', ativo: false },
    });
  });
});

describe('DELETE /api/banners/[id]', () => {
  it('retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await bannerDELETE(
      jsonRequest('http://localhost/api/banners/b1', 'DELETE'),
      idParams()
    );
    expect(res.status).toBe(401);
  });

  it('retorna 403 sem permissao de excluir', async () => {
    mockHasPermission.mockResolvedValue(false);
    const res = await bannerDELETE(
      jsonRequest('http://localhost/api/banners/b1', 'DELETE'),
      idParams()
    );
    expect(res.status).toBe(403);
    expect(mockHasPermission).toHaveBeenCalledWith('u1', 'banners', 'excluir');
  });

  it('exclui banner existente', async () => {
    (prisma.banner.findUnique as jest.Mock).mockResolvedValue({
      id: 'b1',
      organizacaoId: 'org-a',
      titulo: 'X',
    });
    const res = await bannerDELETE(
      jsonRequest('http://localhost/api/banners/b1', 'DELETE'),
      idParams()
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(prisma.banner.delete).toHaveBeenCalledWith({ where: { id: 'b1' } });
  });
});
