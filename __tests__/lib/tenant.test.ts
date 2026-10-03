/**
 * @jest-environment node
 */
import { resolveOrgScope, assertOrgAccess, withOrgScope, orgFilter, ORG_FORBIDDEN } from '@/lib/tenant';
import { canManageOrganization } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    usuarioOrganizacao: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  },
}));

jest.mock('@/lib/auth-helpers', () => ({
  canManageOrganization: jest.fn(),
}));

const mockFindMany = prisma.usuarioOrganizacao.findMany as jest.Mock;
const mockAudit = prisma.auditLog.create as jest.Mock;
const mockCan = canManageOrganization as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockFindMany.mockResolvedValue([{ organizacaoId: 'org-a' }, { organizacaoId: 'org-b' }]);
  mockCan.mockResolvedValue(true);
});

describe('resolveOrgScope', () => {
  it('SUPER_ADMIN recebe modo ALL sem consultar vinculos', async () => {
    const scope = await resolveOrgScope({ id: 'u1', role: 'SUPER_ADMIN' });
    expect(scope).toEqual({ mode: 'ALL', orgIds: [], requestedOrgId: null });
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('nao-SUPER_ADMIN recebe as organizacoes vinculadas', async () => {
    const scope = await resolveOrgScope({ id: 'u1', role: 'PASTOR' });
    expect(scope.mode).toBe('MULTI');
    expect(scope.orgIds).toEqual(['org-a', 'org-b']);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      select: { organizacaoId: true },
    });
  });

  it('um unico vinculo gera modo SINGLE', async () => {
    mockFindMany.mockResolvedValue([{ organizacaoId: 'org-a' }]);
    const scope = await resolveOrgScope({ id: 'u1', role: 'PASTOR' });
    expect(scope.mode).toBe('SINGLE');
    expect(scope.orgIds).toEqual(['org-a']);
  });

  it('organizacao pedida fora do escopo lanca ORG_FORBIDDEN', async () => {
    await expect(
      resolveOrgScope({ id: 'u1', role: 'PASTOR' }, 'org-outra')
    ).rejects.toThrow(ORG_FORBIDDEN);
  });

  it('organizacao pedida dentro do escopo vira modo SINGLE', async () => {
    const scope = await resolveOrgScope({ id: 'u1', role: 'PASTOR' }, 'org-b');
    expect(scope.mode).toBe('SINGLE');
    expect(scope.requestedOrgId).toBe('org-b');
  });

  it('sem nenhum vinculo lanca ORG_FORBIDDEN', async () => {
    mockFindMany.mockResolvedValue([]);
    await expect(resolveOrgScope({ id: 'u1', role: 'MEMBER' })).rejects.toThrow(ORG_FORBIDDEN);
  });

  it('SUPER_ADMIN pode pedir qualquer organizacao', async () => {
    const scope = await resolveOrgScope({ id: 'u1', role: 'SUPER_ADMIN' }, 'org-qualquer');
    expect(scope.mode).toBe('ALL');
    expect(scope.requestedOrgId).toBe('org-qualquer');
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});

describe('assertOrgAccess', () => {
  it('resolve quando o usuario tem vinculo', async () => {
    await expect(assertOrgAccess('u1', 'org-a')).resolves.toBeUndefined();
    expect(mockCan).toHaveBeenCalledWith('u1', 'org-a');
    expect(mockAudit).not.toHaveBeenCalled();
  });

  it('lanca ORG_FORBIDDEN e audita ACESSO_NEGADO quando negado', async () => {
    mockCan.mockResolvedValue(false);
    await expect(assertOrgAccess('u1', 'org-outra')).rejects.toThrow(ORG_FORBIDDEN);
    expect(mockAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'u1',
          acao: 'ACESSO_NEGADO',
          entidade: 'Organizacao',
          entidadeId: 'org-outra',
          resultado: 'NEGADO',
        }),
      })
    );
  });
});

describe('withOrgScope / orgFilter', () => {
  it('modo ALL nao injeta filtro', () => {
    expect(withOrgScope({ nome: 'x' }, { mode: 'ALL', orgIds: [] })).toEqual({ nome: 'x' });
    expect(orgFilter({ mode: 'ALL', orgIds: [] })).toEqual({});
  });

  it('modo MULTI injeta organizacaoId in orgIds', () => {
    const where = withOrgScope({ nome: 'x' }, { mode: 'MULTI', orgIds: ['a', 'b'] });
    expect(where).toEqual({ nome: 'x', organizacaoId: { in: ['a', 'b'] } });
  });

  it('nao sobrescreve organizacaoId ja explicito', () => {
    const where = withOrgScope(
      { organizacaoId: 'a' },
      { mode: 'MULTI', orgIds: ['a', 'b'] }
    );
    expect(where.organizacaoId).toBe('a');
  });
});
