/**
 * @jest-environment node
 */
import { GET as congregacoesGET } from '@/app/api/public/congregacoes/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    organizacao: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

const mockFindMany = prisma.organizacao.findMany as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/public/congregacoes', () => {
  it('lista apenas organizacoes ativas, com site publico e slug', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'org-1',
        nome: 'IADMP Sede',
        slug: 'sede',
        descricao: 'Igreja sede',
        configuracoes: [{ nomeIgreja: 'IADMP Sede', logoUrl: '/logo.png', logoDarkUrl: null, rodapeEndereco: 'Rua A', rodapeTelefone: '99' }],
      },
    ]);

    const res = await congregacoesGET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.organizacoes).toHaveLength(1);
    expect(body.organizacoes[0]).toEqual({
      id: 'org-1',
      nome: 'IADMP Sede',
      slug: 'sede',
      descricao: 'Igreja sede',
      logoUrl: '/logo.png',
      endereco: 'Rua A',
      telefone: '99',
    });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ativo: true,
          sitePublico: true,
          slug: { not: null },
        },
      })
    );
  });

  it('nao vaza organizacao inativa ou sem site publico (filtro no banco)', async () => {
    mockFindMany.mockResolvedValue([]);
    const res = await congregacoesGET();
    const body = await res.json();
    expect(body.organizacoes).toEqual([]);
    const where = mockFindMany.mock.calls[0][0].where;
    expect(where.ativo).toBe(true);
    expect(where.sitePublico).toBe(true);
  });

  it('retorna lista vazia em caso de erro sem derrubar o portal', async () => {
    mockFindMany.mockRejectedValue(new Error('db down'));
    const res = await congregacoesGET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ organizacoes: [] });
  });
});
