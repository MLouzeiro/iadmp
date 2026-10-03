/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as eventosGET, POST as eventosPOST } from '@/app/api/eventos/route';
import {
  GET as eventoGET,
  PUT as eventoPUT,
  DELETE as eventoDELETE,
} from '@/app/api/eventos/[id]/route';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    evento: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
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
const mockFindUnique = prisma.evento.findUnique as jest.Mock;
const mockFindMany = prisma.evento.findMany as jest.Mock;

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

describe('isolamento de eventos por organizacao', () => {
  it('GET /api/eventos filtra pelos vinculos do usuario', async () => {
    const res = await eventosGET(new NextRequest('http://localhost/api/eventos'));
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizacaoId: { in: ['org-a'] } }),
      })
    );
  });

  it('GET /api/eventos com organizacaoId alheio retorna 403', async () => {
    const res = await eventosGET(new NextRequest('http://localhost/api/eventos?organizacaoId=org-b'));
    expect(res.status).toBe(403);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('GET /api/eventos/[id] de outra organizacao retorna 403', async () => {
    mockFindUnique.mockResolvedValue({ id: 'id1', organizacaoId: 'org-outra' });
    mockCan.mockResolvedValue(false);
    const res = await eventoGET(new NextRequest('http://localhost/api/eventos/id1'), idParams());
    expect(res.status).toBe(403);
  });

  it('PUT /api/eventos/[id] de outra organizacao retorna 403 e nao edita', async () => {
    mockFindUnique.mockResolvedValue({ id: 'id1', organizacaoId: 'org-outra' });
    mockCan.mockResolvedValue(false);
    const res = await eventoPUT(
      jsonRequest('http://localhost/api/eventos/id1', 'PUT', { nome: 'Hackeado' }),
      idParams()
    );
    expect(res.status).toBe(403);
    expect(prisma.evento.update).not.toHaveBeenCalled();
  });

  it('DELETE /api/eventos/[id] de outra organizacao retorna 403 e nao exclui', async () => {
    mockFindUnique.mockResolvedValue({ id: 'id1', organizacaoId: 'org-outra' });
    mockCan.mockResolvedValue(false);
    const res = await eventoDELETE(jsonRequest('http://localhost/api/eventos/id1', 'DELETE'), idParams());
    expect(res.status).toBe(403);
    expect(prisma.evento.delete).not.toHaveBeenCalled();
  });

  it('POST /api/eventos recusa organizacaoId alheio no corpo', async () => {
    const res = await eventosPOST(
      jsonRequest('http://localhost/api/eventos', 'POST', {
        nome: 'Culto',
        dataInicio: '2026-01-04',
        dataEvento: '2026-01-04',
        organizacaoId: 'org-outra',
      })
    );
    expect(res.status).toBe(403);
    expect(prisma.evento.create).not.toHaveBeenCalled();
  });

  it('POST /api/eventos grava na organizacao alvo quando autorizado', async () => {
    const res = await eventosPOST(
      jsonRequest('http://localhost/api/eventos', 'POST', {
        nome: 'Culto',
        dataInicio: '2026-01-04',
        dataEvento: '2026-01-04',
        organizacaoId: 'org-a',
      })
    );
    expect(res.status).toBe(201);
    expect(prisma.evento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizacaoId: 'org-a', nome: 'Culto' }),
      })
    );
  });

  it('POST /api/eventos sem permissao retorna 403', async () => {
    mockPerm.mockResolvedValue(false);
    const res = await eventosPOST(
      jsonRequest('http://localhost/api/eventos', 'POST', {
        nome: 'Culto',
        dataInicio: '2026-01-04',
        dataEvento: '2026-01-04',
      })
    );
    expect(res.status).toBe(403);
  });
});
