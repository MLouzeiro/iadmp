/**
 * @jest-environment node
 */
import { GET as healthGET } from '@/app/api/health/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      count: jest.fn().mockResolvedValue(3),
    },
  },
}));

const mockCount = prisma.user.count as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockCount.mockResolvedValue(3);
});

describe('GET /api/health', () => {
  it('retorna 200 com status e conexao, sem expor contagens', async () => {
    const res = await healthGET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.database).toBe('connected');
    expect(body).not.toHaveProperty('userCount');
    expect(body).not.toHaveProperty('nextauthUrl');
  });

  it('nunca expoe o valor de NEXTAUTH_URL', async () => {
    const original = process.env.NEXTAUTH_URL;
    process.env.NEXTAUTH_URL = 'https://segredo-interno.example.com';
    try {
      const res = await healthGET();
      const text = JSON.stringify(await res.json());
      expect(text).not.toContain('segredo-interno.example.com');
    } finally {
      if (original === undefined) delete process.env.NEXTAUTH_URL;
      else process.env.NEXTAUTH_URL = original;
    }
  });

  it('indica env como SET/NOT SET sem vazar valores', async () => {
    const res = await healthGET();
    const body = await res.json();
    expect(['SET (hidden)', 'NOT SET']).toContain(body.databaseUrl);
    expect(['SET (hidden)', 'NOT SET']).toContain(body.nextauthSecret);
  });

  it('erro de banco retorna 500 sem vazar mensagem interna', async () => {
    mockCount.mockRejectedValue(new Error('FATAL: password=segura123 na conexao'));
    const res = await healthGET();
    expect(res.status).toBe(500);
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain('segura123');
    expect(text).not.toContain('FATAL');
  });
});
