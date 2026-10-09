/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as indicadoresGET } from '@/app/api/lideranca/indicadores/route';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    lideranca: {
      findMany: jest.fn().mockResolvedValue([]),
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
const mockFindMany = prisma.lideranca.findMany as jest.Mock;
const mockVinculos = prisma.usuarioOrganizacao.findMany as jest.Mock;

const UNAUTH = () => Promise.reject(new Error('UNAUTHORIZED'));

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ id: 'u1', email: 'a@a.com', name: 'User', role: 'SUPER_ADMIN' });
  mockFindMany.mockResolvedValue([]);
  mockVinculos.mockResolvedValue([]);
});

describe('GET /api/lideranca/indicadores', () => {
  it('retorna 401 sem sessao', async () => {
    mockAuth.mockImplementation(UNAUTH);
    const res = await indicadoresGET(new NextRequest('http://localhost/api/lideranca/indicadores'));
    expect(res.status).toBe(401);
  });

  it('retorna 200 com o shape completo mesmo sem liderancas', async () => {
    const res = await indicadoresGET(new NextRequest('http://localhost/api/lideranca/indicadores'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ativos: 0,
      tempoMedioAtivosDias: 0,
      passaram: 0,
      tempoMedioPassouDias: 0,
    });
  });

  it('calcula contagens e tempos medios com fallback de datas', async () => {
    const dias = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
    mockFindMany.mockResolvedValue([
      { ativo: true, dataInicio: dias(10), dataFim: null, createdAt: dias(30), updatedAt: dias(1) },
      { ativo: true, dataInicio: dias(20), dataFim: null, createdAt: dias(40), updatedAt: dias(1) },
      // encerrado sem dataFim -> usa updatedAt como fim (fallback)
      { ativo: false, dataInicio: dias(100), dataFim: dias(40), createdAt: dias(120), updatedAt: dias(45) },
      // sem dataInicio -> usa createdAt como inicio (fallback)
      { ativo: false, dataInicio: null, dataFim: dias(30), createdAt: dias(90), updatedAt: dias(20) },
    ]);

    const res = await indicadoresGET(new NextRequest('http://localhost/api/lideranca/indicadores'));
    const body = await res.json();

    expect(body.ativos).toBe(2);
    expect(body.passaram).toBe(2);
    expect(body.tempoMedioAtivosDias).toBeGreaterThanOrEqual(14);
    expect(body.tempoMedioAtivosDias).toBeLessThanOrEqual(16);
    // encerrados: (100-40=60) e (90-30=60) -> media 60
    expect(body.tempoMedioPassouDias).toBeGreaterThanOrEqual(59);
    expect(body.tempoMedioPassouDias).toBeLessThanOrEqual(61);
  });

  it('filtra por organizacoes do usuario (nao-SUPER_ADMIN)', async () => {
    mockAuth.mockResolvedValue({ id: 'u2', email: 'b@b.com', name: 'User', role: 'LIDER' });
    mockVinculos.mockResolvedValue([{ organizacaoId: 'org-1' }, { organizacaoId: 'org-2' }]);

    const res = await indicadoresGET(new NextRequest('http://localhost/api/lideranca/indicadores'));
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizacaoId: { in: ['org-1', 'org-2'] } },
      })
    );
  });

  it('retorna 403 para usuario sem vinculo de organizacao', async () => {
    mockAuth.mockResolvedValue({ id: 'u3', email: 'c@c.com', name: 'User', role: 'LIDER' });
    mockVinculos.mockResolvedValue([]);
    const res = await indicadoresGET(new NextRequest('http://localhost/api/lideranca/indicadores'));
    expect(res.status).toBe(403);
  });

  it('nao vaza stack trace em erro interno', async () => {
    mockFindMany.mockRejectedValue(new Error('boom-com-stack'));
    const res = await indicadoresGET(new NextRequest('http://localhost/api/lideranca/indicadores'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Erro ao buscar indicadores de liderança');
    expect(JSON.stringify(body)).not.toContain('boom-com-stack');
  });
});
