/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as membrosGET, POST as membrosPOST } from '@/app/api/membros/route';
import {
  GET as membroGET,
  PUT as membroPUT,
  DELETE as membroDELETE,
} from '@/app/api/membros/[id]/route';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    membro: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    congregacao: {
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'cong1' }),
    },
    usuarioOrganizacao: {
      findMany: jest.fn().mockResolvedValue([{ organizacaoId: 'org-a' }]),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  },
}));

jest.mock('@/lib/auth-helpers', () => ({
  requireAuth: jest.fn(),
  hasPermission: jest.fn(),
  canManageOrganization: jest.fn(),
}));

const mockAuth = requireAuth as jest.Mock;
const mockPerm = hasPermission as jest.Mock;
const mockCan = canManageOrganization as jest.Mock;
const mockMembroFindUnique = prisma.membro.findUnique as jest.Mock;
const mockMembroFindMany = prisma.membro.findMany as jest.Mock;
const mockAudit = prisma.auditLog.create as jest.Mock;

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

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ id: 'u1', email: 'a@a.com', name: 'User', role: 'PASTOR' });
  mockPerm.mockResolvedValue(true);
  mockCan.mockResolvedValue(true);
});

describe('isolamento de membros por organizacao', () => {
  it('GET /api/membros filtra pelos vinculos do usuario', async () => {
    const res = await membrosGET(new NextRequest('http://localhost/api/membros'));
    expect(res.status).toBe(200);
    expect(mockMembroFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizacaoId: { in: ['org-a'] } }),
      })
    );
  });

  it('GET /api/membros com organizacaoId alheio retorna 403', async () => {
    const res = await membrosGET(new NextRequest('http://localhost/api/membros?organizacaoId=org-b'));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Sem permissão para esta organização' });
    expect(mockMembroFindMany).not.toHaveBeenCalled();
  });

  it('GET /api/membros com organizacaoId propria funciona', async () => {
    const res = await membrosGET(new NextRequest('http://localhost/api/membros?organizacaoId=org-a'));
    expect(res.status).toBe(200);
    expect(mockMembroFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizacaoId: 'org-a' }) })
    );
  });

  it('GET /api/membros/[id] de outra organizacao retorna 403', async () => {
    mockMembroFindUnique.mockResolvedValue({ id: 'id1', organizacaoId: 'org-outra' });
    mockCan.mockResolvedValue(false);
    const res = await membroGET(new NextRequest('http://localhost/api/membros/id1'), idParams());
    expect(res.status).toBe(403);
    expect(mockCan).toHaveBeenCalledWith('u1', 'org-outra');
  });

  it('PUT /api/membros/[id] de outra organizacao retorna 403 e nao edita', async () => {
    mockMembroFindUnique.mockResolvedValue({ id: 'id1', organizacaoId: 'org-outra' });
    mockCan.mockResolvedValue(false);
    const res = await membroPUT(
      jsonRequest('http://localhost/api/membros/id1', 'PUT', { nome: 'Hackeado' }),
      idParams()
    );
    expect(res.status).toBe(403);
    expect(prisma.membro.update).not.toHaveBeenCalled();
  });

  it('DELETE /api/membros/[id] de outra organizacao retorna 403 e nao exclui', async () => {
    mockMembroFindUnique.mockResolvedValue({ id: 'id1', organizacaoId: 'org-outra' });
    mockCan.mockResolvedValue(false);
    const res = await membroDELETE(jsonRequest('http://localhost/api/membros/id1', 'DELETE'), idParams());
    expect(res.status).toBe(403);
    expect(prisma.membro.delete).not.toHaveBeenCalled();
  });

  it('POST /api/membros recusa organizacaoId alheio no corpo', async () => {
    const res = await membrosPOST(
      jsonRequest('http://localhost/api/membros', 'POST', {
        nome: 'Invasor',
        organizacaoId: 'org-outra',
      })
    );
    expect(res.status).toBe(403);
    expect(prisma.membro.create).not.toHaveBeenCalled();
  });

  it('POST /api/membros grava na organizacao alvo quando autorizado', async () => {
    mockCan.mockResolvedValue(true);
    const res = await membrosPOST(
      jsonRequest('http://localhost/api/membros', 'POST', {
        nome: 'Maria',
        organizacaoId: 'org-a',
        congregacao: 'Matriz',
      })
    );
    expect(res.status).toBe(201);
    expect(prisma.membro.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizacaoId: 'org-a', nome: 'Maria' }),
      })
    );
  });

  it('POST /api/membros sem organizacaoId usa o unico vinculo do usuario', async () => {
    const res = await membrosPOST(
      jsonRequest('http://localhost/api/membros', 'POST', { nome: 'Joao' })
    );
    expect(res.status).toBe(201);
    expect(prisma.membro.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ organizacaoId: 'org-a' }) })
    );
  });

  it('usuario sem vinculo nao lista nada', async () => {
    (prisma.usuarioOrganizacao.findMany as jest.Mock).mockResolvedValue([]);
    const res = await membrosGET(new NextRequest('http://localhost/api/membros'));
    expect(res.status).toBe(403);
  });

  it('acesso negado gera registro ACESSO_NEGADO', async () => {
    mockMembroFindUnique.mockResolvedValue({ id: 'id1', organizacaoId: 'org-outra' });
    mockCan.mockResolvedValue(false);
    await membroGET(new NextRequest('http://localhost/api/membros/id1'), idParams());
    expect(mockAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ acao: 'ACESSO_NEGADO', resultado: 'NEGADO' }),
      })
    );
  });
});
