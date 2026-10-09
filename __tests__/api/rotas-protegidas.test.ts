/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as membrosGET } from '@/app/api/membros/route';
import { DELETE as membroDELETE } from '@/app/api/membros/[id]/route';
import { POST as eventosPOST } from '@/app/api/eventos/route';
import { PUT as eventoPUT } from '@/app/api/eventos/[id]/route';
import { GET as configGET, PUT as configPUT } from '@/app/api/configuracoes/route';
import { GET as dashboardGET } from '@/app/api/dashboard/route';
import { POST as avisosPOST } from '@/app/api/avisos/route';
import { DELETE as liderDELETE } from '@/app/api/lideranca/[id]/route';
import { GET as seedGET } from '@/app/api/seed/route';
import { requireAuth, requireSuperAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    membro: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      delete: jest.fn().mockResolvedValue({}),
    },
    evento: {
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
    },
    lideranca: {
      delete: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
    },
    aviso: {
      create: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
    },
    configuracoesIgreja: {
      findFirst: jest.fn().mockResolvedValue({ id: 'cfg1', nomeIgreja: 'Igreja Teste' }),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn().mockResolvedValue({ id: 'cfg1', nomeIgreja: 'Igreja Teste' }),
    },
    organizacao: {
      findMany: jest.fn().mockResolvedValue([{ id: 'org1' }]),
    },
    user: {
      count: jest.fn().mockResolvedValue(0),
      upsert: jest.fn().mockResolvedValue({ id: 'u1' }),
    },
    usuarioOrganizacao: {
      findMany: jest.fn().mockResolvedValue([{ organizacaoId: 'org1' }]),
      findUnique: jest.fn().mockResolvedValue({ userId: 'u1', organizacaoId: 'org1' }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  },
}));

jest.mock('@/lib/auth-helpers', () => ({
  requireAuth: jest.fn(),
  requireSuperAdmin: jest.fn(),
  hasPermission: jest.fn().mockResolvedValue(true),
  canManageOrganization: jest.fn().mockResolvedValue(true),
  getUserPermissions: jest.fn().mockResolvedValue([]),
  getUserOrganizations: jest.fn().mockResolvedValue([]),
}));

const mockAuth = requireAuth as jest.Mock;
const mockSuper = requireSuperAdmin as jest.Mock;

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

const UNAUTH = () => Promise.reject(new Error('UNAUTHORIZED'));

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ id: 'u1', email: 'a@a.com', name: 'User', role: 'ADMIN' });
  mockSuper.mockResolvedValue({ id: 'u1', email: 'a@a.com', name: 'User', role: 'SUPER_ADMIN' });
});

describe('rotas agora protegidas por sessao', () => {
  it('GET /api/membros retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await membrosGET(new NextRequest('http://localhost/api/membros?page=1'));
    expect(res.status).toBe(401);
  });

  it('GET /api/membros retorna 200 com sessao', async () => {
    const res = await membrosGET(new NextRequest('http://localhost/api/membros?page=1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ membros: [], total: 0, page: 1, limit: 20 });
  });

  it('DELETE /api/membros/[id] retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await membroDELETE(jsonRequest('http://localhost/api/membros/x', 'DELETE'), idParams());
    expect(res.status).toBe(401);
  });

  it('POST /api/eventos retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await eventosPOST(
      jsonRequest('http://localhost/api/eventos', 'POST', {
        nome: 'Culto',
        dataInicio: '2026-01-04',
        dataEvento: '2026-01-04',
      })
    );
    expect(res.status).toBe(401);
  });

  it('PUT /api/eventos/[id] retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await eventoPUT(
      jsonRequest('http://localhost/api/eventos/x', 'PUT', { nome: 'Culto' }),
      idParams()
    );
    expect(res.status).toBe(401);
  });

  it('PUT /api/configuracoes retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await configPUT(
      jsonRequest('http://localhost/api/configuracoes', 'PUT', { nomeIgreja: 'Nova' })
    );
    expect(res.status).toBe(401);
  });

  it('GET /api/configuracoes continua PUBLICO (tema do site) e nao chama requireAuth', async () => {
    const res = await configGET();
    expect(res.status).toBe(200);
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it('GET /api/dashboard retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await dashboardGET();
    expect(res.status).toBe(401);
  });

  it('POST /api/avisos retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await avisosPOST(
      jsonRequest('http://localhost/api/avisos', 'POST', { titulo: 'Aviso', descricao: 'x' })
    );
    expect(res.status).toBe(401);
  });

  it('DELETE /api/lideranca/[id] retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await liderDELETE(jsonRequest('http://localhost/api/lideranca/x', 'DELETE'), idParams());
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/configuracoes - escopo de organizacao', () => {
  it('resolve a organizacao automaticamente quando o corpo nao envia organizacaoId', async () => {
    const res = await configPUT(
      jsonRequest('http://localhost/api/configuracoes', 'PUT', { nomeIgreja: 'Nova Igreja' })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('id');
  });

  it('retorna 400 quando existem varias organizacoes e nenhuma foi informada', async () => {
    (prisma.usuarioOrganizacao.findMany as jest.Mock).mockResolvedValueOnce([
      { organizacaoId: 'org1' },
      { organizacaoId: 'org2' },
    ]);
    (prisma.organizacao.findMany as jest.Mock).mockResolvedValueOnce([
      { id: 'org1' },
      { id: 'org2' },
    ]);
    const res = await configPUT(
      jsonRequest('http://localhost/api/configuracoes', 'PUT', { nomeIgreja: 'Nova Igreja' })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});

describe('GET /api/seed', () => {
  const env = process.env as Record<string, string | undefined>;
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    env.NODE_ENV = originalEnv;
  });

  it('retorna 404 em producao (rota inexistente para o mundo)', async () => {
    env.NODE_ENV = 'production';
    const res = await seedGET();
    expect(res.status).toBe(404);
    expect(mockSuper).not.toHaveBeenCalled();
  });

  it('retorna 401 fora de producao quando nao ha SUPER_ADMIN na sessao', async () => {
    mockSuper.mockImplementation(() => Promise.reject(new Error('UNAUTHORIZED')));
    const res = await seedGET();
    expect(res.status).toBe(401);
  });

  it('resposta de erro nao vaza stack trace', async () => {
    mockSuper.mockImplementation(() => Promise.reject(new Error('UNAUTHORIZED')));
    const res = await seedGET();
    const body = await res.json();
    expect(body).not.toHaveProperty('stack');
  });
});
