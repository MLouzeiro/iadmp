/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as heroStatsGET } from '@/app/api/public/hero-stats/route';
import { GET as bannersGET } from '@/app/api/public/banners/route';
import { GET as footerInfoGET } from '@/app/api/public/footer-info/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    organizacao: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    configuracoesIgreja: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    banner: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    membro: { count: jest.fn().mockResolvedValue(0) },
    congregacao: { count: jest.fn().mockResolvedValue(0) },
    lideranca: { count: jest.fn().mockResolvedValue(0) },
    ministerio: { count: jest.fn().mockResolvedValue(0) },
  },
}));

const mockOrgFindFirst = prisma.organizacao.findFirst as jest.Mock;
const mockConfigFindUnique = prisma.configuracoesIgreja.findUnique as jest.Mock;
const mockBannerFindMany = prisma.banner.findMany as jest.Mock;
const mockMembroCount = prisma.membro.count as jest.Mock;
const mockCongregacaoCount = prisma.congregacao.count as jest.Mock;
const mockLiderancaCount = prisma.lideranca.count as jest.Mock;
const mockMinisterioCount = prisma.ministerio.count as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockOrgFindFirst.mockResolvedValue(null);
  mockConfigFindUnique.mockResolvedValue(null);
  mockBannerFindMany.mockResolvedValue([]);
  mockMembroCount.mockResolvedValue(0);
  mockCongregacaoCount.mockResolvedValue(0);
  mockLiderancaCount.mockResolvedValue(0);
  mockMinisterioCount.mockResolvedValue(0);
});

describe('GET /api/public/hero-stats', () => {
  it('sem organizacao ativa devolve apenas exibir vazio (sem contagens)', async () => {
    mockOrgFindFirst.mockResolvedValue(null);
    const res = await heroStatsGET(new NextRequest('http://localhost/api/public/hero-stats'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ exibir: {} });
    expect(mockMembroCount).not.toHaveBeenCalled();
  });

  it('sem configuracao aplica os defaults de producao (membro oculto, demais visiveis, 12 anos)', async () => {
    mockOrgFindFirst.mockResolvedValue({ id: 'org-a' });
    mockConfigFindUnique.mockResolvedValue(null);
    mockCongregacaoCount.mockResolvedValue(5);
    mockLiderancaCount.mockResolvedValue(11);
    mockMinisterioCount.mockResolvedValue(3);

    const res = await heroStatsGET(new NextRequest('http://localhost/api/public/hero-stats'));
    const body = await res.json();

    expect(body.congregacoes).toBe(5);
    expect(body.lideres).toBe(11);
    expect(body.ministerios).toBe(3);
    expect(body.anosHistoria).toBe(12);
    expect(body.exibir).toEqual({
      membros: false,
      congregacoes: true,
      lideres: true,
      anosHistoria: true,
      ministerios: true,
    });
  });

  it('mantem o valor de producao (5) quando nao ha congregacoes cadastradas', async () => {
    mockOrgFindFirst.mockResolvedValue({ id: 'org-a' });
    mockConfigFindUnique.mockResolvedValue(null);
    mockCongregacaoCount.mockResolvedValue(0);

    const res = await heroStatsGET(new NextRequest('http://localhost/api/public/hero-stats'));
    const body = await res.json();

    expect(body.congregacoes).toBe(5);
    expect(body.lideres).toBe(0);
    expect(body.ministerios).toBe(0);
  });

  it('calcula anos de historia pelo ano de fundacao', async () => {
    const anoFundacao = new Date().getFullYear() - 10;
    mockOrgFindFirst.mockResolvedValue({ id: 'org-a' });
    mockConfigFindUnique.mockResolvedValue({
      anoFundacao,
      statMembros: true,
      statCongregacoes: true,
      statLideres: false,
      statAnosHistoria: true,
      statMinisterios: false,
    });
    mockMembroCount.mockResolvedValue(42);
    mockCongregacaoCount.mockResolvedValue(2);
    mockLiderancaCount.mockResolvedValue(7);
    mockMinisterioCount.mockResolvedValue(4);

    const res = await heroStatsGET(new NextRequest('http://localhost/api/public/hero-stats'));
    const body = await res.json();

    expect(body.anosHistoria).toBe(10);
    expect(body.membros).toBe(42);
    expect(body.exibir).toEqual({
      membros: true,
      congregacoes: true,
      lideres: false,
      anosHistoria: true,
      ministerios: false,
    });
  });

  it('contagens sao filtradas pela organizacao padrao', async () => {
    mockOrgFindFirst.mockResolvedValue({ id: 'org-a' });
    await heroStatsGET(new NextRequest('http://localhost/api/public/hero-stats'));

    expect(mockMembroCount).toHaveBeenCalledWith({ where: { organizacaoId: 'org-a', status: 'ATIVO' } });
    expect(mockCongregacaoCount).toHaveBeenCalledWith({ where: { organizacaoId: 'org-a', ativo: true } });
    expect(mockLiderancaCount).toHaveBeenCalledWith({ where: { organizacaoId: 'org-a', ativo: true } });
    expect(mockMinisterioCount).toHaveBeenCalledWith({ where: { organizacaoId: 'org-a', ativo: true } });
  });
});

describe('GET /api/public/banners', () => {
  it('sem organizacao ativa devolve lista vazia', async () => {
    mockOrgFindFirst.mockResolvedValue(null);
    const res = await bannersGET(new NextRequest('http://localhost/api/public/banners'));
    expect(await res.json()).toEqual([]);
    expect(mockBannerFindMany).not.toHaveBeenCalled();
  });

  it('filtra por ativo e janela de datas e ordena por ordem', async () => {
    mockOrgFindFirst.mockResolvedValue({ id: 'org-a' });
    const agora = expect.any(Date);
    mockBannerFindMany.mockResolvedValue([{ id: 'b1', titulo: 'Flyer', ordem: 1 }]);

    const res = await bannersGET(new NextRequest('http://localhost/api/public/banners'));
    expect(res.status).toBe(200);

    expect(mockBannerFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizacaoId: 'org-a',
          ativo: true,
          AND: [
            { OR: [{ dataInicio: null }, { dataInicio: { lte: agora } }] },
            { OR: [{ dataFim: null }, { dataFim: { gte: agora } }] },
          ],
        }),
        orderBy: { ordem: 'asc' },
      })
    );
  });

  it('nao inclui banner inativo nem fora da janela (ja filtrado pelo where do banco)', async () => {
    mockOrgFindFirst.mockResolvedValue({ id: 'org-a' });
    mockBannerFindMany.mockResolvedValue([]);
    const res = await bannersGET(new NextRequest('http://localhost/api/public/banners'));
    const body = await res.json();
    expect(body).toEqual([]);
  });
});

describe('GET /api/public/footer-info', () => {
  it('sem organizacao ativa devolve objeto vazio (client aplica fallback)', async () => {
    mockOrgFindFirst.mockResolvedValue(null);
    const res = await footerInfoGET(new NextRequest('http://localhost/api/public/footer-info'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
    expect(mockConfigFindUnique).not.toHaveBeenCalled();
  });

  it('sem configuracao devolve objeto vazio', async () => {
    mockOrgFindFirst.mockResolvedValue({ id: 'org-a' });
    mockConfigFindUnique.mockResolvedValue(null);
    const res = await footerInfoGET(new NextRequest('http://localhost/api/public/footer-info'));
    expect(await res.json()).toEqual({});
  });

  it('retorna os campos do rodape configurados', async () => {
    mockOrgFindFirst.mockResolvedValue({ id: 'org-a' });
    mockConfigFindUnique.mockResolvedValue({
      nomeIgreja: 'Igreja Teste',
      anoFundacao: 2014,
      rodapeDescricao: 'Descricao editada',
      rodapeEndereco: 'Rua X, 100',
      rodapeTelefone: '+55 98 99999-0000',
      rodapeEmail: 'contato@igreja.com',
      rodapeWhatsapp: 'https://wa.me/5598000000000',
      rodapeYoutube: 'https://youtube.com/@teste',
      rodapeInstagram: 'https://instagram.com/teste',
      rodapeFacebook: null,
    });

    const res = await footerInfoGET(new NextRequest('http://localhost/api/public/footer-info'));
    const body = await res.json();

    expect(body.rodapeDescricao).toBe('Descricao editada');
    expect(body.rodapeEndereco).toBe('Rua X, 100');
    expect(body.rodapeWhatsapp).toBe('https://wa.me/5598000000000');
    expect(body.rodapeFacebook).toBeNull();
    expect(mockConfigFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizacaoId: 'org-a' } })
    );
  });
});
