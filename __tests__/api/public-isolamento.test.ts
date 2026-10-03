/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as churchInfoGET } from '@/app/api/public/church-info/route';
import { GET as publicEventosGET } from '@/app/api/public/eventos/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    organizacao: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    evento: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

const mockOrgFindFirst = prisma.organizacao.findFirst as jest.Mock;
const mockEventoFindMany = prisma.evento.findMany as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/public/church-info', () => {
  it('sem parametro usa a organizacao padrao (mais antiga ativa)', async () => {
    mockOrgFindFirst.mockResolvedValue({ id: 'org-a' });
    const res = await churchInfoGET(new NextRequest('http://localhost/api/public/church-info'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ organizacaoId: 'org-a' });
    expect(mockOrgFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ativo: true },
        orderBy: { createdAt: 'asc' },
      })
    );
  });

  it('com organizacaoId valida que a organizacao existe e esta ativa', async () => {
    mockOrgFindFirst.mockResolvedValue({ id: 'org-b' });
    const res = await churchInfoGET(
      new NextRequest('http://localhost/api/public/church-info?organizacaoId=org-b')
    );
    expect(await res.json()).toEqual({ organizacaoId: 'org-b' });
    expect(mockOrgFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'org-b', ativo: true } })
    );
  });

  it('organizacao inexistente ou inativa retorna null (sem vazar outra igreja)', async () => {
    mockOrgFindFirst.mockResolvedValue(null);
    const res = await churchInfoGET(
      new NextRequest('http://localhost/api/public/church-info?organizacaoId=org-fantasma')
    );
    expect(await res.json()).toEqual({ organizacaoId: null });
  });
});

describe('GET /api/public/eventos', () => {
  it('filtra eventos pela organizacao informada', async () => {
    mockOrgFindFirst.mockResolvedValue({ id: 'org-b' });
    const res = await publicEventosGET(
      new NextRequest('http://localhost/api/public/eventos?organizacaoId=org-b')
    );
    expect(res.status).toBe(200);
    expect(mockEventoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizacaoId: 'org-b', publicarNoSite: true },
      })
    );
  });

  it('sem parametro usa a organizacao padrao (nao vaza eventos de todas as igrejas)', async () => {
    mockOrgFindFirst.mockResolvedValue({ id: 'org-a' });
    const res = await publicEventosGET(new NextRequest('http://localhost/api/public/eventos'));
    expect(res.status).toBe(200);
    expect(mockEventoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizacaoId: 'org-a' }),
      })
    );
  });

  it('sem nenhuma organizacao ativa nao consulta eventos', async () => {
    mockOrgFindFirst.mockResolvedValue(null);
    const res = await publicEventosGET(new NextRequest('http://localhost/api/public/eventos'));
    expect(await res.json()).toEqual({ eventos: [] });
    expect(mockEventoFindMany).not.toHaveBeenCalled();
  });

  it('organizacaoId invalido nao retorna eventos de outra igreja', async () => {
    mockOrgFindFirst.mockResolvedValue(null);
    const res = await publicEventosGET(
      new NextRequest('http://localhost/api/public/eventos?organizacaoId=org-fantasma')
    );
    expect(await res.json()).toEqual({ eventos: [] });
    expect(mockEventoFindMany).not.toHaveBeenCalled();
  });
});
