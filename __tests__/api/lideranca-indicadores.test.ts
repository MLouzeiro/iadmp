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
    evento: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    liturgia: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    pregacao: {
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
const mockEventos = prisma.evento.findMany as jest.Mock;
const mockLiturgias = prisma.liturgia.findMany as jest.Mock;
const mockPregacoes = prisma.pregacao.findMany as jest.Mock;
const mockVinculos = prisma.usuarioOrganizacao.findMany as jest.Mock;

const UNAUTH = () => Promise.reject(new Error('UNAUTHORIZED'));
const dias = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ id: 'u1', email: 'a@a.com', name: 'User', role: 'SUPER_ADMIN' });
  mockFindMany.mockResolvedValue([]);
  mockEventos.mockResolvedValue([]);
  mockLiturgias.mockResolvedValue([]);
  mockPregacoes.mockResolvedValue([]);
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
      lideres: [],
    });
  });

  it('calcula contagens e tempos medios com fallback de datas', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'l1', nome: 'Lider Um', cargo: 'Pastor', ativo: true, dataInicio: dias(10), dataFim: null, createdAt: dias(30), updatedAt: dias(1) },
      { id: 'l2', nome: 'Lider Dois', cargo: 'Diácono', ativo: true, dataInicio: dias(20), dataFim: null, createdAt: dias(40), updatedAt: dias(1) },
      // encerrado sem dataFim -> usa updatedAt como fim (fallback)
      { id: 'l3', nome: 'Lider Tres', cargo: 'Líder', ativo: false, dataInicio: dias(100), dataFim: dias(40), createdAt: dias(120), updatedAt: dias(45) },
      // sem dataInicio -> usa createdAt como inicio (fallback)
      { id: 'l4', nome: 'Lider Quatro', cargo: 'Líder', ativo: false, dataInicio: null, dataFim: dias(30), createdAt: dias(90), updatedAt: dias(20) },
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
    expect(body.lideres).toHaveLength(4);
    expect(body.lideres[0]).toEqual(
      expect.objectContaining({
        liderancaId: 'l1',
        nome: 'Lider Um',
        cargo: 'Pastor',
        ativo: true,
        tempoDias: expect.any(Number),
        tempoLabel: expect.any(String),
        desempenho: { eventos: 0, liturgias: 0, pregacoes: 0, total: 0 },
      })
    );
    expect(body.lideres[2].ativo).toBe(false);
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
    for (const fonte of [mockEventos, mockLiturgias, mockPregacoes]) {
      expect(fonte).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizacaoId: { in: ['org-1', 'org-2'] } }),
        })
      );
    }
  });

  it('consulta as fontes de desempenho com status e janela do ano corrente', async () => {
    await indicadoresGET(new NextRequest('http://localhost/api/lideranca/indicadores'));

    const janela = { gte: expect.any(Date), lte: expect.any(Date) };
    expect(mockEventos).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'CONCLUIDO', dataEvento: janela }),
        select: { responsavelGeral: true, preletores: true },
      })
    );
    expect(mockLiturgias).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'REALIZADA', data: janela }),
        select: { pregador: true, responsavel: true, dirigente: true },
      })
    );
    expect(mockPregacoes).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PUBLICADA', data: janela }),
        select: { pregadorNome: true },
      })
    );
  });

  it('monta desempenho por lider via responsavel, preletores, liturgia e pregacao', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'l1', nome: 'João Pereira', cargo: 'Diácono', ativo: true, dataInicio: dias(30), dataFim: null, createdAt: dias(60), updatedAt: dias(1) },
    ]);
    mockEventos.mockResolvedValue([
      { responsavelGeral: 'João Pereira', preletores: [] },
      { responsavelGeral: 'Outro Nome', preletores: ['Pr. João Pereira'] },
      { responsavelGeral: 'Fulano de Tal', preletores: [] },
    ]);
    mockLiturgias.mockResolvedValue([
      { pregador: 'João Pereira', responsavel: null, dirigente: null },
      { pregador: 'Outro', responsavel: 'João Pereira', dirigente: null },
      { pregador: 'Fulano', responsavel: 'Beltrano', dirigente: 'Sicrano' },
    ]);
    mockPregacoes.mockResolvedValue([
      { pregadorNome: 'Joao Pereira' },
      { pregadorNome: 'Fulano' },
    ]);

    const res = await indicadoresGET(new NextRequest('http://localhost/api/lideranca/indicadores'));
    const body = await res.json();

    expect(body.lideres).toHaveLength(1);
    const det = body.lideres[0];
    expect(det).toEqual(
      expect.objectContaining({
        liderancaId: 'l1',
        nome: 'João Pereira',
        cargo: 'Diácono',
        ativo: true,
        tempoDias: expect.any(Number),
        tempoLabel: expect.any(String),
      })
    );
    expect(det.tempoDias).toBeGreaterThanOrEqual(29);
    expect(det.tempoDias).toBeLessThanOrEqual(31);
    expect(det.desempenho).toEqual({ eventos: 2, liturgias: 2, pregacoes: 1, total: 5 });
  });

  it('ignora coincidencias parciais ou nomes curtos demais', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'l1', nome: 'Jose', cargo: 'Pastor', ativo: true, dataInicio: dias(10), dataFim: null, createdAt: dias(10), updatedAt: dias(1) },
      { id: 'l2', nome: 'Ana', cargo: 'Líder', ativo: true, dataInicio: dias(10), dataFim: null, createdAt: dias(10), updatedAt: dias(1) },
    ]);
    mockPregacoes.mockResolvedValue([
      { pregadorNome: 'Josefa' },
      { pregadorNome: 'Ana Souza' },
    ]);
    mockEventos.mockResolvedValue([{ responsavelGeral: 'Josefa Maria', preletores: [] }]);
    mockLiturgias.mockResolvedValue([{ pregador: 'Anastácia', responsavel: null, dirigente: null }]);

    const res = await indicadoresGET(new NextRequest('http://localhost/api/lideranca/indicadores'));
    const body = await res.json();

    expect(body.lideres[0].desempenho.total).toBe(0);
    expect(body.lideres[1].desempenho.total).toBe(0);
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
