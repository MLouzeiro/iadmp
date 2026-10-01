/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as listaGET } from '@/app/api/public/pregacoes/route';
import { GET as detalheGET } from '@/app/api/public/pregacoes/[slug]/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    pregacao: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
  },
}));

const mockFindMany = prisma.pregacao.findMany as jest.Mock;
const mockFindFirst = prisma.pregacao.findFirst as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockFindFirst.mockResolvedValue(null);
});

function slugParams(slug = 'mensagem-da-semana') {
  return { params: Promise.resolve({ slug }) };
}

describe('GET /api/public/pregacoes (lista)', () => {
  it('retorna 400 sem organizacaoId', async () => {
    const res = await listaGET(new NextRequest('http://localhost/api/public/pregacoes'));
    expect(res.status).toBe(400);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('retorna 200 apenas com pregacoes PUBLICADAS da organizacao', async () => {
    mockFindMany.mockResolvedValue([{ id: 'p1', titulo: 'Mensagem', slug: 'mensagem' }]);
    const res = await listaGET(
      new NextRequest('http://localhost/api/public/pregacoes?organizacaoId=org1&limit=4')
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pregacoes).toHaveLength(1);

    const where = mockFindMany.mock.calls[0][0].where;
    expect(where.organizacaoId).toBe('org1');
    expect(where.status).toBe('PUBLICADA');
  });

  it('nao expoe campos internos (observacoes, createdById, status)', async () => {
    mockFindMany.mockResolvedValue([{ id: 'p1' }]);
    const res = await listaGET(
      new NextRequest('http://localhost/api/public/pregacoes?organizacaoId=org1')
    );
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain('observacoes');
    expect(text).not.toContain('createdById');
    expect(mockFindMany.mock.calls[0][0].select).not.toHaveProperty('observacoes');
  });

  it('erro de banco retorna 500 sem vazar mensagem interna', async () => {
    mockFindMany.mockRejectedValue(new Error('FATAL: password=segura123'));
    const res = await listaGET(
      new NextRequest('http://localhost/api/public/pregacoes?organizacaoId=org1')
    );
    expect(res.status).toBe(500);
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain('segura123');
  });
});

describe('GET /api/public/pregacoes/[slug] (detalhe)', () => {
  it('retorna 404 quando o slug nao existe ou nao esta publicada', async () => {
    mockFindFirst.mockResolvedValue(null);
    const res = await detalheGET(
      new NextRequest('http://localhost/api/public/pregacoes/nao-existe'),
      slugParams('nao-existe')
    );
    expect(res.status).toBe(404);
  });

  it('busca apenas pregacao PUBLICADA pelo slug', async () => {
    mockFindFirst.mockResolvedValue({ id: 'p1', titulo: 'Mensagem', slug: 'mensagem-da-semana' });
    const res = await detalheGET(
      new NextRequest('http://localhost/api/public/pregacoes/mensagem-da-semana'),
      slugParams('mensagem-da-semana')
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pregacao.slug).toBe('mensagem-da-semana');

    const args = mockFindFirst.mock.calls[0][0];
    expect(args.where.slug).toBe('mensagem-da-semana');
    expect(args.where.status).toBe('PUBLICADA');
    expect(args.select).not.toHaveProperty('observacoes');
    expect(args.select).not.toHaveProperty('createdById');
  });

  it('erro de banco retorna 500 sem vazar mensagem interna', async () => {
    mockFindFirst.mockRejectedValue(new Error('FATAL: password=segura123'));
    const res = await detalheGET(
      new NextRequest('http://localhost/api/public/pregacoes/x'),
      slugParams('x')
    );
    expect(res.status).toBe(500);
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain('segura123');
  });
});
