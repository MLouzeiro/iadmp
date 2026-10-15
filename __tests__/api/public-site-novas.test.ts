/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as avisosGET } from '@/app/api/public/avisos/route';
import { GET as programacaoGET } from '@/app/api/public/programacao/route';
import { GET as ministeriosGET } from '@/app/api/public/ministerios/route';
import { prisma } from '@/lib/prisma';

// Evita carregar next-auth (ESM) — tenant.ts só usa canManageOrganization destes helpers.
jest.mock('@/lib/auth-helpers', () => ({
  canManageOrganization: jest.fn().mockResolvedValue(false),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    organizacao: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    aviso: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    liturgia: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    ministerio: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

const mockOrgFindFirst = prisma.organizacao.findFirst as jest.Mock;
const mockAvisoFindMany = prisma.aviso.findMany as jest.Mock;
const mockLiturgiaFindMany = prisma.liturgia.findMany as jest.Mock;
const mockMinisterioFindMany = prisma.ministerio.findMany as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockAvisoFindMany.mockResolvedValue([]);
  mockLiturgiaFindMany.mockResolvedValue([]);
  mockMinisterioFindMany.mockResolvedValue([]);
});

describe('GET /api/public/avisos', () => {
  it('filtra por publicarSite, situação ATIVO e janela de exibição', async () => {
    mockOrgFindFirst.mockResolvedValue({ id: 'org1' });
    mockAvisoFindMany.mockResolvedValue([
      { id: 'a1', titulo: 'Culto especial', destaque: true },
    ]);
    const res = await avisosGET(
      new NextRequest('http://localhost/api/public/avisos?organizacaoId=org1')
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.avisos).toHaveLength(1);
    const where = mockAvisoFindMany.mock.calls[0][0].where;
    expect(where.organizacaoId).toBe('org1');
    expect(where.publicarSite).toBe(true);
    expect(where.situacaoAviso).toBe('ATIVO');
    expect(where.OR).toBeDefined();
    expect(mockAvisoFindMany.mock.calls[0][0].select).not.toHaveProperty('mostrarPainel');
    expect(mockAvisoFindMany.mock.calls[0][0].select).not.toHaveProperty('createdById');
  });

  it('organizacaoId invalido retorna lista vazia sem fallback', async () => {
    mockOrgFindFirst.mockResolvedValue(null);
    const res = await avisosGET(
      new NextRequest('http://localhost/api/public/avisos?organizacaoId=nao-existe')
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ avisos: [] });
    expect(mockAvisoFindMany).not.toHaveBeenCalled();
  });

  it('erro de banco retorna 500 sem vazar mensagem interna', async () => {
    mockOrgFindFirst.mockResolvedValue({ id: 'org1' });
    mockAvisoFindMany.mockRejectedValue(new Error('FATAL: password=segura123'));
    const res = await avisosGET(
      new NextRequest('http://localhost/api/public/avisos?organizacaoId=org1')
    );
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('segura123');
  });
});

describe('GET /api/public/programacao', () => {
  it('retorna liturgias futuras, sem RASCUNHO/CANCELADA, sem campos internos', async () => {
    mockOrgFindFirst.mockResolvedValue({ id: 'org1' });
    mockLiturgiaFindMany.mockResolvedValue([
      {
        id: 'l1',
        data: new Date('2026-10-14T19:00:00.000Z'),
        horarioInicio: '19:00',
        horarioFimPrevisto: null,
        tipoCulto: 'Celebracao',
        tema: 'Oração e Fé',
        dirigente: 'Pastor João',
        pregador: null,
      },
    ]);
    const res = await programacaoGET(
      new NextRequest('http://localhost/api/public/programacao?organizacaoId=org1')
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.programacao).toHaveLength(1);
    expect(body.programacao[0]).toEqual(
      expect.objectContaining({
        id: 'l1',
        tipoCulto: 'Celebracao',
        dirigente: 'Pastor João',
        pregador: null,
      })
    );
    const args = mockLiturgiaFindMany.mock.calls[0][0];
    expect(args.where.status).toEqual({ notIn: ['RASCUNHO', 'CANCELADA'] });
    expect(args.where.data).toHaveProperty('gte');
    expect(args.select).not.toHaveProperty('observacoes');
    expect(args.select).not.toHaveProperty('dirigenteId');
    expect(args.select).not.toHaveProperty('createdById');
  });

  it('organizacaoId invalido retorna programacao vazia', async () => {
    mockOrgFindFirst.mockResolvedValue(null);
    const res = await programacaoGET(
      new NextRequest('http://localhost/api/public/programacao?organizacaoId=x')
    );
    expect(await res.json()).toEqual({ programacao: [] });
    expect(mockLiturgiaFindMany).not.toHaveBeenCalled();
  });
});

describe('GET /api/public/ministerios', () => {
  it('lista apenas ministerios ativos da organizacao', async () => {
    mockOrgFindFirst.mockResolvedValue({ id: 'org1' });
    mockMinisterioFindMany.mockResolvedValue([
      { id: 'm1', nome: 'Louvor', descricao: 'Ministério de louvor', responsavel: 'Ana' },
    ]);
    const res = await ministeriosGET(
      new NextRequest('http://localhost/api/public/ministerios?organizacaoId=org1')
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ministerios).toHaveLength(1);
    const where = mockMinisterioFindMany.mock.calls[0][0].where;
    expect(where).toEqual({ organizacaoId: 'org1', ativo: true });
    expect(mockMinisterioFindMany.mock.calls[0][0].select).toEqual({
      id: true,
      nome: true,
      descricao: true,
      responsavel: true,
    });
  });

  it('slug invalido retorna lista vazia sem fallback', async () => {
    mockOrgFindFirst.mockResolvedValue(null);
    const res = await ministeriosGET(
      new NextRequest('http://localhost/api/public/ministerios?slug=nao-existe')
    );
    expect(await res.json()).toEqual({ ministerios: [] });
    expect(mockMinisterioFindMany).not.toHaveBeenCalled();
  });
});
