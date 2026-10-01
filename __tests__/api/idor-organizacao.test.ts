/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as liturgiaGET, POST as liturgiaPOST } from '@/app/api/liturgia/route';
import { GET as litGET, PUT as litPUT, DELETE as litDELETE } from '@/app/api/liturgia/[id]/route';
import { POST as duplicarPOST } from '@/app/api/liturgia/[id]/duplicar/route';
import { PATCH as statusPATCH } from '@/app/api/liturgia/[id]/status/route';
import { GET as modoGET } from '@/app/api/liturgia/[id]/modo-culto/route';
import { GET as musicasGET, POST as musicasPOST } from '@/app/api/liturgia/musicas/route';
import { GET as musicaGET, PUT as musicaPUT, DELETE as musicaDELETE } from '@/app/api/liturgia/musicas/[id]/route';
import { GET as modelosGET, POST as modelosPOST } from '@/app/api/liturgia/modelos/route';
import { GET as modeloGET, PUT as modeloPUT, DELETE as modeloDELETE } from '@/app/api/liturgia/modelos/[id]/route';
import { GET as versiculosGET } from '@/app/api/admin/versiculos/route';
import { GET as versiculoGET } from '@/app/api/admin/versiculos/[id]/route';
import { GET as pregacoesGET } from '@/app/api/comunicacao/pregacoes/route';
import { GET as pregacaoGET } from '@/app/api/comunicacao/pregacoes/[id]/route';
import { GET as canaisGET } from '@/app/api/comunicacao/canais/route';
import { GET as canalGET } from '@/app/api/comunicacao/canais/[id]/route';
import { GET as comDashboardGET } from '@/app/api/comunicacao/dashboard/route';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    liturgia: {
      findUnique: jest.fn().mockResolvedValue({ id: 'lit1', organizacaoId: 'org-outra', tema: 'T', itens: [] }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    liturgiaMusica: {
      findUnique: jest.fn().mockResolvedValue({ id: 'mus1', organizacaoId: 'org-outra', titulo: 'X' }),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    liturgiaModelo: {
      findUnique: jest.fn().mockResolvedValue({ id: 'mod1', organizacaoId: 'org-outra', nome: 'X', momentos: [] }),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    versiculoDiario: {
      findUnique: jest.fn().mockResolvedValue({ id: 'ver1', organizacaoId: 'org-outra', historico: [] }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    pregacao: {
      findUnique: jest.fn().mockResolvedValue({ id: 'pre1', organizacaoId: 'org-outra' }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    canalOficial: {
      findUnique: jest.fn().mockResolvedValue({ id: 'can1', organizacaoId: 'org-outra' }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    usuarioOrganizacao: {
      findMany: jest.fn().mockResolvedValue([{ organizacaoId: 'org-vinculo' }]),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/auth-helpers', () => ({
  requireAuth: jest.fn(),
  requireSuperAdmin: jest.fn(),
  hasPermission: jest.fn(),
  canManageOrganization: jest.fn(),
  getUserPermissions: jest.fn().mockResolvedValue([]),
  getUserOrganizations: jest.fn().mockResolvedValue([]),
}));

const mockAuth = requireAuth as jest.Mock;
const mockPerm = hasPermission as jest.Mock;
const mockCan = canManageOrganization as jest.Mock;

function jsonRequest(url: string, method: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function idParams(id = 'id1') {
  return { params: Promise.resolve({ id }) };
}

const ORG403 = { error: 'Sem permissao para esta organizacao' };

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ id: 'u1', email: 'a@a.com', name: 'User', role: 'PASTOR' });
  mockPerm.mockResolvedValue(true);
  mockCan.mockResolvedValue(false);
});

describe('GET listas com organizacaoId (query) exigem membership', () => {
  it('GET /api/liturgia retorna 403 para organizacao alheia', async () => {
    const res = await liturgiaGET(new NextRequest('http://localhost/api/liturgia?organizacaoId=org-outra'));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
  });

  it('GET /api/liturgia sem organizacaoId restringe nao-SUPER_ADMIN aos vinculos', async () => {
    const res = await liturgiaGET(new NextRequest('http://localhost/api/liturgia'));
    expect(res.status).toBe(200);
    expect(mockCan).not.toHaveBeenCalled();
    expect(prisma.usuarioOrganizacao.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      select: { organizacaoId: true },
    });
    expect(prisma.liturgia.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizacaoId: { in: ['org-vinculo'] } }) })
    );
  });

  it('GET /api/liturgia/musicas retorna 403 para organizacao alheia', async () => {
    const res = await musicasGET(new NextRequest('http://localhost/api/liturgia/musicas?organizacaoId=org-outra'));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
  });

  it('GET /api/liturgia/modelos retorna 403 para organizacao alheia', async () => {
    const res = await modelosGET(new NextRequest('http://localhost/api/liturgia/modelos?organizacaoId=org-outra'));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
  });

  it('GET /api/admin/versiculos retorna 403 para organizacao alheia', async () => {
    const res = await versiculosGET(new NextRequest('http://localhost/api/admin/versiculos?organizacaoId=org-outra'));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
  });

  it('GET /api/comunicacao/pregacoes retorna 403 para organizacao alheia', async () => {
    const res = await pregacoesGET(new NextRequest('http://localhost/api/comunicacao/pregacoes?organizacaoId=org-outra'));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
  });

  it('GET /api/comunicacao/canais retorna 403 para organizacao alheia', async () => {
    const res = await canaisGET(new NextRequest('http://localhost/api/comunicacao/canais?organizacaoId=org-outra'));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
  });

  it('GET /api/comunicacao/dashboard retorna 403 para organizacao alheia', async () => {
    const res = await comDashboardGET(new NextRequest('http://localhost/api/comunicacao/dashboard?organizacaoId=org-outra'));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
  });
});

describe('POSTs exigem membership na organizacao do corpo', () => {
  it('POST /api/liturgia retorna 403 para organizacao alheia', async () => {
    const res = await liturgiaPOST(
      jsonRequest('http://localhost/api/liturgia', 'POST', {
        organizacaoId: 'org-outra',
        data: '2026-01-04',
        horarioInicio: '19:00',
      })
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
    expect(prisma.liturgia.create).not.toHaveBeenCalled();
  });

  it('POST /api/liturgia/musicas retorna 403 para organizacao alheia', async () => {
    const res = await musicasPOST(
      jsonRequest('http://localhost/api/liturgia/musicas', 'POST', { organizacaoId: 'org-outra', titulo: 'X' })
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
    expect(prisma.liturgiaMusica.create).not.toHaveBeenCalled();
  });

  it('POST /api/liturgia/modelos retorna 403 para organizacao alheia', async () => {
    const res = await modelosPOST(
      jsonRequest('http://localhost/api/liturgia/modelos', 'POST', { organizacaoId: 'org-outra', nome: 'X' })
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
    expect(prisma.liturgiaModelo.create).not.toHaveBeenCalled();
  });
});

describe('[id] exigem membership na organizacao do registro', () => {
  it('GET /api/liturgia/[id] retorna 403 para organizacao alheia', async () => {
    const res = await litGET(new NextRequest('http://localhost/api/liturgia/lit1'), idParams());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
  });

  it('PUT /api/liturgia/[id] retorna 403 para organizacao alheia', async () => {
    const res = await litPUT(jsonRequest('http://localhost/api/liturgia/lit1', 'PUT', { tema: 'Novo' }), idParams());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('DELETE /api/liturgia/[id] retorna 403 para organizacao alheia', async () => {
    const res = await litDELETE(jsonRequest('http://localhost/api/liturgia/lit1', 'DELETE'), idParams());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
    expect(prisma.liturgia.delete).not.toHaveBeenCalled();
  });

  it('POST /api/liturgia/[id]/duplicar retorna 403 para organizacao alheia', async () => {
    const res = await duplicarPOST(jsonRequest('http://localhost/api/liturgia/lit1/duplicar', 'POST', {}), idParams());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
    expect(prisma.liturgia.create).not.toHaveBeenCalled();
  });

  it('PATCH /api/liturgia/[id]/status retorna 403 para organizacao alheia', async () => {
    const res = await statusPATCH(
      jsonRequest('http://localhost/api/liturgia/lit1/status', 'PATCH', { status: 'PRONTA' }),
      idParams()
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
    expect(prisma.liturgia.update).not.toHaveBeenCalled();
  });

  it('GET /api/liturgia/[id]/modo-culto retorna 403 para organizacao alheia', async () => {
    const res = await modoGET(new NextRequest('http://localhost/api/liturgia/lit1/modo-culto'), idParams());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
  });

  it('GET /api/liturgia/musicas/[id] retorna 403 para organizacao alheia', async () => {
    const res = await musicaGET(new NextRequest('http://localhost/api/liturgia/musicas/mus1'), idParams());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
  });

  it('GET /api/liturgia/modelos/[id] retorna 403 para organizacao alheia', async () => {
    const res = await modeloGET(new NextRequest('http://localhost/api/liturgia/modelos/mod1'), idParams());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
  });

  it('GET /api/admin/versiculos/[id] retorna 403 para organizacao alheia', async () => {
    const res = await versiculoGET(new NextRequest('http://localhost/api/admin/versiculos/ver1'), idParams());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
  });

  it('GET /api/comunicacao/pregacoes/[id] retorna 403 para organizacao alheia', async () => {
    const res = await pregacaoGET(new NextRequest('http://localhost/api/comunicacao/pregacoes/pre1'), idParams());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
  });

  it('GET /api/comunicacao/canais/[id] retorna 403 para organizacao alheia', async () => {
    const res = await canalGET(new NextRequest('http://localhost/api/comunicacao/canais/can1'), idParams());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
  });

  it('PUT /api/liturgia/musicas/[id] retorna 403 para organizacao alheia', async () => {
    const res = await musicaPUT(jsonRequest('http://localhost/api/liturgia/musicas/mus1', 'PUT', { titulo: 'X' }), idParams());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
    expect(prisma.liturgiaMusica.update).not.toHaveBeenCalled();
  });

  it('DELETE /api/liturgia/musicas/[id] retorna 403 para organizacao alheia', async () => {
    const res = await musicaDELETE(jsonRequest('http://localhost/api/liturgia/musicas/mus1', 'DELETE'), idParams());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
    expect(prisma.liturgiaMusica.update).not.toHaveBeenCalled();
  });

  it('PUT /api/liturgia/modelos/[id] retorna 403 para organizacao alheia', async () => {
    const res = await modeloPUT(jsonRequest('http://localhost/api/liturgia/modelos/mod1', 'PUT', { nome: 'X' }), idParams());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('DELETE /api/liturgia/modelos/[id] retorna 403 para organizacao alheia', async () => {
    const res = await modeloDELETE(jsonRequest('http://localhost/api/liturgia/modelos/mod1', 'DELETE'), idParams());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(ORG403);
    expect(prisma.liturgiaModelo.update).not.toHaveBeenCalled();
  });
});

describe('caminho feliz preservado', () => {
  it('GET /api/liturgia/[id] retorna 200 quando o usuario pertence a organizacao', async () => {
    mockCan.mockResolvedValue(true);
    const res = await litGET(new NextRequest('http://localhost/api/liturgia/lit1'), idParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.liturgia.id).toBe('lit1');
  });

  it('SUPER_ADMIN enxerga todas as liturgias sem filtro de vinculo', async () => {
    mockAuth.mockResolvedValue({ id: 'u1', email: 'a@a.com', name: 'User', role: 'SUPER_ADMIN' });
    const res = await liturgiaGET(new NextRequest('http://localhost/api/liturgia'));
    expect(res.status).toBe(200);
    expect(prisma.usuarioOrganizacao.findMany).not.toHaveBeenCalled();
  });
});
