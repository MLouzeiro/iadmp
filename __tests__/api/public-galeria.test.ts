/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/public/galeria/route';
import { prisma } from '@/lib/prisma';
import { resolvePublicOrganizacaoId } from '@/lib/tenant';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    galeriaItem: { findMany: jest.fn() },
  },
}));

jest.mock('@/lib/tenant', () => ({
  resolvePublicOrganizacaoId: jest.fn(),
}));

const mockFindMany = prisma.galeriaItem.findMany as jest.Mock;
const mockResolve = resolvePublicOrganizacaoId as jest.Mock;

function req(query = ''): NextRequest {
  return new NextRequest(`http://localhost/api/public/galeria${query}`);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
});

describe('GET /api/public/galeria', () => {
  it('retorna apenas as imagens da organização resolvida pelo slug', async () => {
    mockResolve.mockResolvedValue('org1');
    const itens = [
      { id: 'g1', titulo: 'Culto de domingo', url: 'https://cdn.example/f1.jpg' },
      { id: 'g2', titulo: null, url: 'https://cdn.example/f2.jpg' },
    ];
    mockFindMany.mockResolvedValue(itens);

    const res = await GET(req('?slug=ministerio-da-promessa'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ imagens: itens });

    expect(mockResolve).toHaveBeenCalledWith({
      slug: 'ministerio-da-promessa',
      organizacaoId: null,
    });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizacaoId: 'org1' }),
        orderBy: { ordem: 'asc' },
      })
    );
  });

  it('retorna lista vazia e não consulta o banco quando nenhuma organização é resolvida', async () => {
    mockResolve.mockResolvedValue(null);

    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ imagens: [] });
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
