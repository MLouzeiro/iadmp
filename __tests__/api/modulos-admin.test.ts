/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as avisosGET, POST as avisosPOST } from '@/app/api/avisos/route';
import { PUT as avisoPUT, DELETE as avisoDELETE } from '@/app/api/avisos/[id]/route';
import { GET as financeiroGET, POST as financeiroPOST } from '@/app/api/financeiro/route';
import { PUT as lancamentoPUT, DELETE as lancamentoDELETE } from '@/app/api/financeiro/[id]/route';
import { GET as galeriaGET, POST as galeriaPOST } from '@/app/api/galeria/route';
import { DELETE as galeriaDELETE } from '@/app/api/galeria/[id]/route';
import { GET as oportunidadesGET, POST as oportunidadesPOST } from '@/app/api/oportunidades/route';
import { DELETE as oportunidadeDELETE } from '@/app/api/oportunidades/[id]/route';
import { POST as contatoPOST } from '@/app/api/public/contato/route';
import { GET as liderancaPublicaGET } from '@/app/api/public/lideranca/route';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    aviso: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'a1' }),
      update: jest.fn().mockResolvedValue({ id: 'a1' }),
      delete: jest.fn().mockResolvedValue({}),
    },
    eventoFinanceiro: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'f1' }),
      update: jest.fn().mockResolvedValue({ id: 'f1' }),
      delete: jest.fn().mockResolvedValue({}),
    },
    galeriaItem: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'g1' }),
      update: jest.fn().mockResolvedValue({ id: 'g1' }),
      delete: jest.fn().mockResolvedValue({}),
    },
    oportunidade: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'o1' }),
      update: jest.fn().mockResolvedValue({ id: 'o1' }),
      delete: jest.fn().mockResolvedValue({}),
    },
    lideranca: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    organizacao: {
      findFirst: jest.fn().mockResolvedValue({ id: 'org1', ativo: true }),
    },
    contatoMensagem: {
      create: jest.fn().mockResolvedValue({ id: 'c1' }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  },
}));

jest.mock('@/lib/audit', () => ({
  writeAudit: jest.fn().mockResolvedValue(undefined),
  extractRequestMeta: jest.fn().mockReturnValue({ ip: '127.0.0.1', userAgent: 'test' }),
}));

jest.mock('@/lib/auth-helpers', () => ({
  requireAuth: jest.fn(),
  hasPermission: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/tenant', () => ({
  resolveOrgScope: jest.fn().mockResolvedValue({ mode: 'SINGLE', orgIds: ['org1'], requestedOrgId: null }),
  resolveTargetOrgId: jest.fn().mockResolvedValue('org1'),
  resolveCongregacaoId: jest.fn().mockResolvedValue('cong1'),
  assertOrgAccess: jest.fn().mockResolvedValue(undefined),
  ORG_FORBIDDEN: 'ORG_FORBIDDEN',
  ORG_REQUIRED: 'ORG_REQUIRED',
  orgForbiddenResponse: () => new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403 }),
}));

const mockAuth = requireAuth as jest.Mock;
const mockPermission = hasPermission as jest.Mock;

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
  mockPermission.mockResolvedValue(true);
});

describe('/api/avisos e /api/avisos/[id]', () => {
  it('GET /api/avisos retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await avisosGET(new NextRequest('http://localhost/api/avisos'));
    expect(res.status).toBe(401);
  });

  it('GET /api/avisos retorna 200 com sessao', async () => {
    const res = await avisosGET(new NextRequest('http://localhost/api/avisos'));
    expect(res.status).toBe(200);
  });

  it('POST /api/avisos retorna 403 sem permissao', async () => {
    mockPermission.mockResolvedValue(false);
    const res = await avisosPOST(jsonRequest('http://localhost/api/avisos', 'POST', {
      titulo: 'Aviso', descricao: 'Descricao',
    }));
    expect(res.status).toBe(403);
  });

  it('POST /api/avisos valida body com Zod e retorna 400 se inválido', async () => {
    const res = await avisosPOST(jsonRequest('http://localhost/api/avisos', 'POST', {}));
    expect(res.status).toBe(400);
  });

  it('PUT /api/avisos/[id] retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await avisoPUT(jsonRequest('http://localhost/api/avisos/x', 'PUT', { titulo: 'T' }), idParams());
    expect(res.status).toBe(401);
  });

  it('DELETE /api/avisos/[id] retorna 404 quando nao existe', async () => {
    const res = await avisoDELETE(jsonRequest('http://localhost/api/avisos/x', 'DELETE'), idParams());
    expect(res.status).toBe(404);
  });
});

describe('/api/financeiro', () => {
  it('GET /api/financeiro retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await financeiroGET(new NextRequest('http://localhost/api/financeiro'));
    expect(res.status).toBe(401);
  });

  it('GET /api/financeiro retorna 403 sem permissao de visualizar', async () => {
    mockPermission.mockResolvedValue(false);
    const res = await financeiroGET(new NextRequest('http://localhost/api/financeiro'));
    expect(res.status).toBe(403);
  });

  it('POST /api/financeiro retorna 400 quando valor e negativo', async () => {
    const res = await financeiroPOST(jsonRequest('http://localhost/api/financeiro', 'POST', {
      descricao: 'Dizimo', valor: -10, tipo: 'ENTRADA',
    }));
    expect(res.status).toBe(400);
  });

  it('POST /api/financeiro cria lancamento valido', async () => {
    const res = await financeiroPOST(jsonRequest('http://localhost/api/financeiro', 'POST', {
      descricao: 'Dizimo', valor: 100, tipo: 'ENTRADA', categoria: 'DIZIMO',
    }));
    expect(res.status).toBe(201);
  });

  it('DELETE /api/financeiro/[id] retorna 404 quando nao existe', async () => {
    const res = await lancamentoDELETE(jsonRequest('http://localhost/api/financeiro/x', 'DELETE'), idParams());
    expect(res.status).toBe(404);
  });
});

describe('/api/galeria', () => {
  it('GET /api/galeria retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await galeriaGET(new NextRequest('http://localhost/api/galeria'));
    expect(res.status).toBe(401);
  });

  it('POST /api/galeria retorna 400 sem url', async () => {
    const res = await galeriaPOST(jsonRequest('http://localhost/api/galeria', 'POST', { titulo: 'Foto' }));
    expect(res.status).toBe(400);
  });

  it('POST /api/galeria cria item valido', async () => {
    const res = await galeriaPOST(jsonRequest('http://localhost/api/galeria', 'POST', {
      url: '/images/foto.jpg', titulo: 'Foto',
    }));
    expect(res.status).toBe(201);
  });

  it('DELETE /api/galeria/[id] retorna 404 quando nao existe', async () => {
    const res = await galeriaDELETE(jsonRequest('http://localhost/api/galeria/x', 'DELETE'), idParams());
    expect(res.status).toBe(404);
  });
});

describe('/api/oportunidades', () => {
  it('GET /api/oportunidades retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await oportunidadesGET(new NextRequest('http://localhost/api/oportunidades'));
    expect(res.status).toBe(401);
  });

  it('POST /api/oportunidades retorna 400 sem titulo/descricao', async () => {
    const res = await oportunidadesPOST(jsonRequest('http://localhost/api/oportunidades', 'POST', {}));
    expect(res.status).toBe(400);
  });

  it('POST /api/oportunidades cria oportunidade valida', async () => {
    const res = await oportunidadesPOST(jsonRequest('http://localhost/api/oportunidades', 'POST', {
      titulo: 'Voluntariado', descricao: 'Ajude nos cultos', vagas: 5,
    }));
    expect(res.status).toBe(201);
  });

  it('DELETE /api/oportunidades/[id] retorna 404 quando nao existe', async () => {
    const res = await oportunidadeDELETE(jsonRequest('http://localhost/api/oportunidades/x', 'DELETE'), idParams());
    expect(res.status).toBe(404);
  });
});

describe('/api/public/contato e /api/public/public/lideranca', () => {
  it('POST /api/public/contato funciona SEM sessao (rota publica)', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await contatoPOST(jsonRequest('http://localhost/api/public/contato', 'POST', {
      nome: 'Joao', email: 'joao@email.com', mensagem: 'Mensagem de teste',
    }));
    expect(res.status).toBe(201);
  });

  it('POST /api/public/contato retorna 400 com email inválido', async () => {
    const res = await contatoPOST(jsonRequest('http://localhost/api/public/contato', 'POST', {
      nome: 'Joao', email: 'inválido', mensagem: 'Mensagem de teste',
    }));
    expect(res.status).toBe(400);
  });

  it('POST /api/public/contato retorna 400 com mensagem curta', async () => {
    const res = await contatoPOST(jsonRequest('http://localhost/api/public/contato', 'POST', {
      nome: 'Joao', email: 'joao@email.com', mensagem: 'Oi',
    }));
    expect(res.status).toBe(400);
  });

  it('GET /api/public/lideranca funciona SEM sessao (rota publica)', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await liderancaPublicaGET(new NextRequest('http://localhost/api/public/lideranca'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('lideres');
  });
});
