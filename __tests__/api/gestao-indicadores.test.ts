/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as indicadoresGET } from '@/app/api/gestao/indicadores/route';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

const count = jest.fn().mockResolvedValue(0);
const aggregate = jest.fn().mockResolvedValue({ _sum: { valor: 0 } });

jest.mock('@/lib/prisma', () => {
  const modelo = () => ({
    count: (...a: unknown[]) => (globalThis as any).__count(...a),
    aggregate: (...a: unknown[]) => (globalThis as any).__aggregate(...a),
    findFirst: jest.fn().mockResolvedValue(null),
  });
  return {
    prisma: {
      membro: modelo(),
      lideranca: modelo(),
      evento: modelo(),
      aviso: modelo(),
      liturgia: modelo(),
      pregacao: modelo(),
      canalOficial: modelo(),
      eventoFinanceiro: modelo(),
      inscricao: modelo(),
      usuarioOrganizacao: {
        findMany: jest.fn().mockResolvedValue([{ organizacaoId: 'org-a' }]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    },
  };
});

(globalThis as any).__count = count;
(globalThis as any).__aggregate = aggregate;

jest.mock('@/lib/auth-helpers', () => ({
  requireAuth: jest.fn(),
  hasPermission: jest.fn(),
  canManageOrganization: jest.fn(),
}));

const mockAuth = requireAuth as jest.Mock;
const mockPerm = hasPermission as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ id: 'u1', email: 'a@a.com', name: 'User', role: 'PASTOR' });
  mockPerm.mockResolvedValue(true);
  count.mockResolvedValue(0);
  aggregate.mockResolvedValue({ _sum: { valor: 0 } });
});

describe('GET /api/gestao/indicadores', () => {
  it('retorna 401 sem sessao', async () => {
    mockAuth.mockRejectedValue(new Error('UNAUTHORIZED'));
    const res = await indicadoresGET(new NextRequest('http://localhost/api/gestao/indicadores'));
    expect(res.status).toBe(401);
  });

  it('retorna 403 sem dashboard:visualizar', async () => {
    mockPerm.mockResolvedValue(false);
    const res = await indicadoresGET(new NextRequest('http://localhost/api/gestao/indicadores'));
    expect(res.status).toBe(403);
  });

  it('retorna 400 para periodo inválido', async () => {
    const res = await indicadoresGET(
      new NextRequest('http://localhost/api/gestao/indicadores?periodo=bogus')
    );
    expect(res.status).toBe(400);
  });

  it('retorna indicadores com periodo, filtros e metadados', async () => {
    const res = await indicadoresGET(
      new NextRequest('http://localhost/api/gestao/indicadores?periodo=30d')
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.periodo).toMatchObject({ tipo: '30d', label: 'Últimos 30 dias' });
    expect(body.periodo).toHaveProperty('atual');
    expect(body.periodo).toHaveProperty('anterior');
    expect(Array.isArray(body.indicadores)).toBe(true);
    expect(body.indicadores.length).toBeGreaterThan(10);
    const primeiro = body.indicadores[0];
    expect(primeiro).toHaveProperty('chave');
    expect(primeiro).toHaveProperty('valor');
    expect(primeiro).toHaveProperty('periodoAnterior');
    expect(primeiro).toHaveProperty('variacaoPercentual');
    expect(primeiro).toHaveProperty('media6Meses');
    expect(primeiro).toHaveProperty('formula');
    expect(primeiro).toHaveProperty('origem');
    expect(primeiro).toHaveProperty('filtrosAplicados');
  });

  it('restringe aos vinculos do usuario', async () => {
    const res = await indicadoresGET(new NextRequest('http://localhost/api/gestao/indicadores'));
    expect(res.status).toBe(200);
    const chamadas = count.mock.calls.map((c: any[]) => c[0]?.where?.organizacaoId);
    expect(chamadas.every((c: any) => c && Array.isArray(c.in) && c.in.includes('org-a'))).toBe(true);
  });

  it('organizacaoId alheio retorna 403', async () => {
    const res = await indicadoresGET(
      new NextRequest('http://localhost/api/gestao/indicadores?organizacaoId=org-outra')
    );
    expect(res.status).toBe(403);
    expect(count).not.toHaveBeenCalled();
  });

  it('aceita filtros de congregacao, evento, categoria e status', async () => {
    const res = await indicadoresGET(
      new NextRequest(
        'http://localhost/api/gestao/indicadores?congregacaoId=cg1&eventoId=ev1&categoria=DIZIMO&status=ATIVO'
      )
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.filtrosAplicados).toMatchObject({
      congregacaoId: 'cg1',
      eventoId: 'ev1',
      categoria: 'DIZIMO',
      status: 'ATIVO',
    });
    const wheres = count.mock.calls.map((c: any[]) => c[0]?.where);
    expect(wheres.some((w: any) => w?.eventoId === 'ev1')).toBe(true);
  });

  it('SUPER_ADMIN consulta sem restricao de vinculo', async () => {
    mockAuth.mockResolvedValue({ id: 'u1', email: 'a@a.com', name: 'User', role: 'SUPER_ADMIN' });
    const res = await indicadoresGET(new NextRequest('http://localhost/api/gestao/indicadores'));
    expect(res.status).toBe(200);
    const wheres = count.mock.calls.map((c: any[]) => c[0]?.where);
    expect(wheres.some((w: any) => w?.organizacaoId === undefined)).toBe(true);
  });
});
