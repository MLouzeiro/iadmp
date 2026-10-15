/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as churchInfoGET } from '@/app/api/public/church-info/route';
import { GET as publicEventosGET } from '@/app/api/public/eventos/route';
import { prisma } from '@/lib/prisma';

// Evita carregar next-auth (ESM) — tenant.ts só usa canManageOrganization destes helpers.
jest.mock('@/lib/auth-helpers', () => ({
  canManageOrganization: jest.fn().mockResolvedValue(false),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    organizacao: {
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    configuracoesIgreja: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    paginaPublica: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    evento: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

const mockOrgFindFirst = prisma.organizacao.findFirst as jest.Mock;
const mockOrgFindUnique = prisma.organizacao.findUnique as jest.Mock;
const mockConfigFindUnique = prisma.configuracoesIgreja.findUnique as jest.Mock;
const mockPaginaPublicaFindUnique = prisma.paginaPublica.findUnique as jest.Mock;
const mockEventoFindMany = prisma.evento.findMany as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/public/church-info', () => {
  it('sem parametro usa a organizacao padrao (mais antiga ativa)', async () => {
    mockOrgFindFirst.mockResolvedValue({ id: 'org-a' });
    mockOrgFindUnique.mockResolvedValue({ id: 'org-a', nome: 'IADMP', slug: 'iadmp', descricao: null, ativo: true });
    const res = await churchInfoGET(new NextRequest('http://localhost/api/public/church-info'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.organizacaoId).toBe('org-a');
    expect(mockOrgFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ativo: true },
        orderBy: { createdAt: 'asc' },
      })
    );
  });

  it('com organizacaoId valida que a organizacao existe, esta ativa e com site publico', async () => {
    mockOrgFindFirst.mockResolvedValue({ id: 'org-b' });
    mockOrgFindUnique.mockResolvedValue({ id: 'org-b', nome: 'Filial', slug: 'filial', descricao: null, ativo: true });
    const res = await churchInfoGET(
      new NextRequest('http://localhost/api/public/church-info?organizacaoId=org-b')
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(expect.objectContaining({ organizacaoId: 'org-b' }));
    expect(mockOrgFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'org-b', ativo: true, sitePublico: true } })
    );
  });

  it('organizacaoId invalido retorna 404 sem cair no fallback da org padrao', async () => {
    // findFirst (byId) null → NÃO deve consultar a org padrão
    mockOrgFindFirst.mockResolvedValue(null);
    const res = await churchInfoGET(
      new NextRequest('http://localhost/api/public/church-info?organizacaoId=org-fantasma')
    );
    expect(res.status).toBe(404);
    expect(mockOrgFindFirst).toHaveBeenCalledTimes(1);
    expect(mockOrgFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 'org-fantasma' }) })
    );
  });

  it('slug invalido retorna 404 sem vazar conteudo de outra igreja', async () => {
    mockOrgFindFirst.mockResolvedValue(null);
    const res = await churchInfoGET(
      new NextRequest('http://localhost/api/public/church-info?slug=nao-existe')
    );
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Igreja não encontrada' });
    expect(mockOrgFindFirst).toHaveBeenCalledTimes(1);
    expect(mockOrgFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'nao-existe', ativo: true, sitePublico: true } })
    );
  });

  it('slug de org com sitePublico=false nao abre (404)', async () => {
    mockOrgFindFirst.mockResolvedValue(null);
    const res = await churchInfoGET(
      new NextRequest('http://localhost/api/public/church-info?slug=site-desligado')
    );
    expect(res.status).toBe(404);
    expect(mockOrgFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ sitePublico: true }) })
    );
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
