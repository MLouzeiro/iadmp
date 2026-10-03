/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as auditoriaGET } from '@/app/api/gestao/auditoria/route';
import { writeAudit, extractRequestMeta } from '@/lib/audit';
import { requireAuth, hasPermission } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({}),
    },
    usuarioOrganizacao: {
      findMany: jest.fn().mockResolvedValue([{ organizacaoId: 'org-a' }]),
      findUnique: jest.fn().mockResolvedValue(null),
    },
  },
}));

jest.mock('@/lib/auth-helpers', () => ({
  requireAuth: jest.fn(),
  hasPermission: jest.fn(),
  canManageOrganization: jest.fn(),
}));

const mockAuth = requireAuth as jest.Mock;
const mockPerm = hasPermission as jest.Mock;
const mockCreate = prisma.auditLog.create as jest.Mock;
const mockFindMany = prisma.auditLog.findMany as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ id: 'u1', email: 'a@a.com', name: 'User', role: 'PASTOR' });
  mockPerm.mockResolvedValue(true);
});

describe('GET /api/gestao/auditoria', () => {
  it('retorna 401 sem sessao', async () => {
    mockAuth.mockRejectedValue(new Error('UNAUTHORIZED'));
    const res = await auditoriaGET(new NextRequest('http://localhost/api/gestao/auditoria'));
    expect(res.status).toBe(401);
  });

  it('retorna 403 sem a permissao usuarios:ver_auditoria', async () => {
    mockPerm.mockResolvedValue(false);
    const res = await auditoriaGET(new NextRequest('http://localhost/api/gestao/auditoria'));
    expect(res.status).toBe(403);
    expect(mockPerm).toHaveBeenCalledWith('u1', 'usuarios', 'ver_auditoria');
  });

  it('filtra pelo escopo de organizacao do usuario', async () => {
    const res = await auditoriaGET(new NextRequest('http://localhost/api/gestao/auditoria'));
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizacaoId: { in: ['org-a'] } }),
      })
    );
  });

  it('organizacaoId alheio retorna 403', async () => {
    (prisma.usuarioOrganizacao.findMany as jest.Mock).mockResolvedValue([
      { organizacaoId: 'org-a' },
    ]);
    const res = await auditoriaGET(
      new NextRequest('http://localhost/api/gestao/auditoria?organizacaoId=org-outra')
    );
    expect(res.status).toBe(403);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('aplica filtros de acao, entidade e periodo', async () => {
    const res = await auditoriaGET(
      new NextRequest(
        'http://localhost/api/gestao/auditoria?acao=DELETE&entidade=Membro&dataInicio=2026-01-01&dataFim=2026-01-31'
      )
    );
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          acao: 'DELETE',
          entidade: 'Membro',
          createdAt: { gte: new Date('2026-01-01'), lte: new Date('2026-01-31') },
        }),
      })
    );
  });

  it('SUPER_ADMIN consulta sem filtro de vinculo', async () => {
    mockAuth.mockResolvedValue({ id: 'u1', email: 'a@a.com', name: 'User', role: 'SUPER_ADMIN' });
    const res = await auditoriaGET(new NextRequest('http://localhost/api/gestao/auditoria'));
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.not.objectContaining({ organizacaoId: expect.anything() }) })
    );
  });
});

describe('writeAudit', () => {
  it('grava com organizacao, ip e user-agent', async () => {
    const req = new NextRequest('http://localhost/api/x', {
      headers: { 'user-agent': 'jest', 'x-forwarded-for': '203.0.113.9' },
    });
    await writeAudit({
      userId: 'u1',
      organizacaoId: 'org-a',
      acao: 'CREATE',
      entidade: 'Membro',
      entidadeId: 'm1',
      depois: { nome: 'Maria' },
      req,
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'u1',
          organizacaoId: 'org-a',
          acao: 'CREATE',
          entidade: 'Membro',
          entidadeId: 'm1',
          ip: '203.0.113.9',
          userAgent: 'jest',
          resultado: 'SUCESSO',
        }),
      })
    );
  });

  it('nao grava senhas, hashes ou tokens', async () => {
    await writeAudit({
      userId: 'u1',
      acao: 'CREATE',
      entidade: 'User',
      depois: {
        name: 'X',
        passwordHash: 'bcrypt$...',
        password: 'segredo',
        NEXTAUTH_SECRET: 'abc',
      },
    });
    const payload = mockCreate.mock.calls[0][0].data.depois;
    expect(payload.passwordHash).toBe('***');
    expect(payload.password).toBe('***');
    expect(payload.NEXTAUTH_SECRET).toBe('***');
    expect(payload.name).toBe('X');
  });

  it('nunca lanca erro mesmo se o banco falhar', async () => {
    mockCreate.mockRejectedValue(new Error('db down'));
    await expect(
      writeAudit({ userId: 'u1', acao: 'CREATE', entidade: 'Membro' })
    ).resolves.toBeUndefined();
  });

  it('registra ACESSO_NEGADO com resultado NEGADO', async () => {
    await writeAudit({
      userId: 'u1',
      organizacaoId: 'org-outra',
      acao: 'ACESSO_NEGADO',
      entidade: 'Organizacao',
      entidadeId: 'org-outra',
      resultado: 'NEGADO',
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ acao: 'ACESSO_NEGADO', resultado: 'NEGADO' }),
      })
    );
  });
});

describe('extractRequestMeta', () => {
  it('le o primeiro IP do x-forwarded-for', () => {
    const req = new NextRequest('http://localhost/', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8', 'user-agent': 'UA' },
    });
    expect(extractRequestMeta(req)).toEqual({ ip: '1.2.3.4', userAgent: 'UA' });
  });

  it('retorna vazio sem request', () => {
    expect(extractRequestMeta()).toEqual({});
  });
});
