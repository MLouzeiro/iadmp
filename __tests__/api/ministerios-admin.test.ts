/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as ministeriosGET, POST as ministeriosPOST } from '@/app/api/ministerios/route';
import { PATCH as ministerioPATCH, DELETE as ministerioDELETE } from '@/app/api/ministerios/[id]/route';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    ministerio: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'm1', nome: 'Louvor', ativo: true }),
      update: jest.fn().mockResolvedValue({ id: 'm1', nome: 'Louvor' }),
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
  getUserPermissions: jest.fn().mockResolvedValue([]),
  getUserOrganizations: jest.fn().mockResolvedValue([]),
}));

const mockAuth = requireAuth as jest.Mock;
const mockHasPermission = hasPermission as jest.Mock;
const mockFindMany = prisma.ministerio.findMany as jest.Mock;
const mockFindUnique = prisma.ministerio.findUnique as jest.Mock;
const mockCreate = prisma.ministerio.create as jest.Mock;
const mockUpdate = prisma.ministerio.update as jest.Mock;

function jsonRequest(url: string, method: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function idParams(id = 'm1') {
  return { params: Promise.resolve({ id }) };
}

const UNAUTH = () => Promise.reject(new Error('UNAUTHORIZED'));

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ id: 'u1', email: 'a@a.com', name: 'User', role: 'SUPER_ADMIN' });
  mockHasPermission.mockResolvedValue(true);
  mockFindMany.mockResolvedValue([]);
  mockFindUnique.mockResolvedValue(null);
  mockCreate.mockResolvedValue({ id: 'm1', nome: 'Louvor', ativo: true });
  mockUpdate.mockResolvedValue({ id: 'm1', nome: 'Louvor' });
});

describe('GET /api/ministerios', () => {
  it('retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await ministeriosGET(new NextRequest('http://localhost/api/ministerios'));
    expect(res.status).toBe(401);
  });

  it('retorna 403 sem permissao do modulo ministerios', async () => {
    mockHasPermission.mockResolvedValue(false);
    const res = await ministeriosGET(new NextRequest('http://localhost/api/ministerios'));
    expect(res.status).toBe(403);
    expect(mockHasPermission).toHaveBeenCalledWith('u1', 'ministerios', 'visualizar');
  });

  it('retorna 200 com sessao e permissao', async () => {
    mockFindMany.mockResolvedValue([{ id: 'm1', nome: 'Louvor', ativo: true }]);
    const res = await ministeriosGET(new NextRequest('http://localhost/api/ministerios'));
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveLength(1);
  });
});

describe('POST /api/ministerios', () => {
  it('retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await ministeriosPOST(
      jsonRequest('http://localhost/api/ministerios', 'POST', { nome: 'Louvor' })
    );
    expect(res.status).toBe(401);
  });

  it('retorna 403 sem permissao de criar', async () => {
    mockHasPermission.mockResolvedValue(false);
    const res = await ministeriosPOST(
      jsonRequest('http://localhost/api/ministerios', 'POST', { nome: 'Louvor' })
    );
    expect(res.status).toBe(403);
    expect(mockHasPermission).toHaveBeenCalledWith('u1', 'ministerios', 'criar');
  });

  it('retorna 400 quando nome esta vazio', async () => {
    const res = await ministeriosPOST(
      jsonRequest('http://localhost/api/ministerios', 'POST', { nome: '' })
    );
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('cria ministerio valido com 201', async () => {
    const res = await ministeriosPOST(
      jsonRequest('http://localhost/api/ministerios', 'POST', {
        nome: 'Louvor',
        descricao: 'Ministerio de louvor e adoracao',
        responsavel: 'Joao',
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('m1');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nome: 'Louvor', responsavel: 'Joao' }),
      })
    );
  });
});

describe('PATCH /api/ministerios/[id]', () => {
  it('retorna 404 quando ministerio nao existe', async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await ministerioPATCH(
      jsonRequest('http://localhost/api/ministerios/m1', 'PATCH', { nome: 'X' }),
      idParams()
    );
    expect(res.status).toBe(404);
  });

  it('atualiza apenas os campos enviados', async () => {
    mockFindUnique.mockResolvedValue({ id: 'm1', organizacaoId: 'org-a', nome: 'Louvor' });
    const res = await ministerioPATCH(
      jsonRequest('http://localhost/api/ministerios/m1', 'PATCH', { responsavel: 'Maria' }),
      idParams()
    );
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { responsavel: 'Maria' },
    });
  });
});

describe('DELETE /api/ministerios/[id]', () => {
  it('inativa o ministerio (soft delete) em vez de excluir fisicamente', async () => {
    mockFindUnique.mockResolvedValue({ id: 'm1', organizacaoId: 'org-a', nome: 'Louvor', ativo: true });
    const res = await ministerioDELETE(
      jsonRequest('http://localhost/api/ministerios/m1', 'DELETE'),
      idParams()
    );
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ where: { id: 'm1' }, data: { ativo: false } });
  });

  it('retorna 403 sem permissao de excluir', async () => {
    mockHasPermission.mockResolvedValue(false);
    mockFindUnique.mockResolvedValue({ id: 'm1', organizacaoId: 'org-a' });
    const res = await ministerioDELETE(
      jsonRequest('http://localhost/api/ministerios/m1', 'DELETE'),
      idParams()
    );
    expect(res.status).toBe(403);
    expect(mockHasPermission).toHaveBeenCalledWith('u1', 'ministerios', 'excluir');
  });
});
