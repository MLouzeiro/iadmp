/**
 * @jest-environment node
 */
import { loadSessionUserState } from '@/lib/session';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
  },
}));

const mockUser = prisma.user.findUnique as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
});

describe('loadSessionUserState', () => {
  it('retorna null quando o usuario nao existe', async () => {
    mockUser.mockResolvedValue(null);
    await expect(loadSessionUserState('u1')).resolves.toBeNull();
  });

  it('retorna role, ativo e organizacoes ativas do usuario', async () => {
    mockUser.mockResolvedValue({
      id: 'u1',
      role: 'LIDER',
      ativo: true,
      organizacoes: [
        { organizacao: { id: 'org-a', nome: 'Sede' } },
        { organizacao: { id: 'org-b', nome: 'Central' } },
      ],
    });

    const state = await loadSessionUserState('u1');

    expect(state).toEqual({
      id: 'u1',
      role: 'LIDER',
      ativo: true,
      organizacoes: [
        { id: 'org-a', nome: 'Sede' },
        { id: 'org-b', nome: 'Central' },
      ],
    });
    expect(mockUser).toHaveBeenCalledWith({
      where: { id: 'u1' },
      select: {
        id: true,
        role: true,
        ativo: true,
        organizacoes: {
          where: { ativo: true, organizacao: { ativo: true } },
          select: { organizacao: { select: { id: true, nome: true } } },
        },
      },
    });
  });

  it('propaga usuario inativo para a sessao ser invalidada', async () => {
    mockUser.mockResolvedValue({ id: 'u1', role: 'MEMBER', ativo: false, organizacoes: [] });
    const state = await loadSessionUserState('u1');
    expect(state?.ativo).toBe(false);
    expect(state?.organizacoes).toEqual([]);
  });
});
