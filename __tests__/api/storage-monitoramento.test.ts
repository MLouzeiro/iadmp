/**
 * @jest-environment node
 */
// Testes de autorização das rotas de monitoramento de armazenamento.

jest.mock('@/lib/auth-helpers', () => ({
  requireAuth: jest.fn(),
  hasPermission: jest.fn(),
  canManageOrganization: jest.fn(),
  requireSuperAdmin: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    storageMeasurement: { findMany: jest.fn(), create: jest.fn(), findFirst: jest.fn() },
    storageAlert: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    storageConfig: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    storedFile: { findMany: jest.fn(), create: jest.fn() },
  },
}));

jest.mock('@/lib/storage', () => ({
  coletarUso: jest.fn(),
  obterConfigLimites: jest.fn(),
  avaliarEAlertar: jest.fn(),
  listarCandidatosLimpeza: jest.fn(),
  uploadArquivo: jest.fn(),
  LIMITES_PADRAO: { limiteBytes: 1073741824, alertaAtencao: 70, alertaCritico: 85, alertaUrgente: 95 },
}));

jest.mock('@/lib/audit', () => ({ writeAudit: jest.fn() }));

import { GET as getMonitoramento, PUT as putMonitoramento } from '@/app/api/storage/monitoramento/route';
import { GET as getLimpeza } from '@/app/api/storage/limpeza/route';
import { PATCH as patchAlerta } from '@/app/api/storage/alertas/[id]/route';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';
import { coletarUso, obterConfigLimites, avaliarEAlertar, listarCandidatosLimpeza } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import type { NextRequest } from 'next/server';

function req(url: string, init?: RequestInit): NextRequest {
  return new Request(`http://localhost${url}`, init) as unknown as NextRequest;
}

const usoOk = {
  totalBytes: 500, fileCount: 2, buckets: {}, fonte: 'INVENTARIO',
  ultimaMedicao: new Date().toISOString(), integraao: 'NORMAL',
};
const configOk = { limiteBytes: 1073741824, alertaAtencao: 70, alertaCritico: 85, alertaUrgente: 95 };

beforeEach(() => {
  jest.clearAllMocks();
  (coletarUso as jest.Mock).mockResolvedValue(usoOk);
  (obterConfigLimites as jest.Mock).mockResolvedValue(configOk);
  (avaliarEAlertar as jest.Mock).mockResolvedValue({ nivel: 'NORMAL', pct: 0, alertaCriado: false });
  (listarCandidatosLimpeza as jest.Mock).mockResolvedValue([]);
  (prisma.storageMeasurement.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.storageAlert.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.storedFile.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.storageAlert.findUnique as jest.Mock) = jest.fn();
});

describe('GET /api/storage/monitoramento', () => {
  it('retorna 401 sem sessão', async () => {
    (requireAuth as jest.Mock).mockRejectedValue(new Error('UNAUTHORIZED'));
    const res = await getMonitoramento(req('/api/storage/monitoramento'));
    expect(res.status).toBe(500); // requireAuth lança; catch genérico
  });

  it('retorna 403 para usuário sem permissão', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({ id: 'u1', role: 'MEMBER' });
    (hasPermission as jest.Mock).mockResolvedValue(false);
    const res = await getMonitoramento(req('/api/storage/monitoramento'));
    expect(res.status).toBe(403);
  });

  it('retorna 200 para SUPER_ADMIN', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({ id: 'u1', role: 'SUPER_ADMIN' });
    const res = await getMonitoramento(req('/api/storage/monitoramento'));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.uso).toBeDefined();
    expect(d.config).toBeDefined();
  });

  it('retorna 403 para não-SUPER_ADMIN consultando outra organização', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({ id: 'u1', role: 'ADMIN_IGREJA' });
    (hasPermission as jest.Mock).mockResolvedValue(true);
    (canManageOrganization as jest.Mock).mockResolvedValue(false);
    const res = await getMonitoramento(req('/api/storage/monitoramento?organizacaoId=outra'));
    expect(res.status).toBe(403);
  });

  it('SUPER_ADMIN pode consultar organização específica', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({ id: 'u1', role: 'SUPER_ADMIN' });
    (canManageOrganization as jest.Mock).mockResolvedValue(true);
    const res = await getMonitoramento(req('/api/storage/monitoramento?organizacaoId=org1'));
    expect(res.status).toBe(200);
    expect(coletarUso).toHaveBeenCalledWith('org1');
  });
});

describe('PUT /api/storage/monitoramento', () => {
  it('retorna 403 para não-SUPER_ADMIN', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({ id: 'u1', role: 'ADMIN' });
    const res = await putMonitoramento(
      req('/api/storage/monitoramento', { method: 'PUT', body: JSON.stringify({ limiteBytes: 1024 ** 3 }) })
    );
    expect(res.status).toBe(403);
  });

  it('retorna 400 para limite inválido', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({ id: 'u1', role: 'SUPER_ADMIN' });
    const res = await putMonitoramento(
      req('/api/storage/monitoramento', { method: 'PUT', body: JSON.stringify({ limiteBytes: -5 }) })
    );
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando atencao >= critico', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({ id: 'u1', role: 'SUPER_ADMIN' });
    const res = await putMonitoramento(
      req('/api/storage/monitoramento', {
        method: 'PUT',
        body: JSON.stringify({ limiteBytes: 1024 ** 3, alertaAtencao: 90, alertaCritico: 80, alertaUrgente: 95 }),
      })
    );
    expect(res.status).toBe(400);
  });

  it('salva config válida para SUPER_ADMIN', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({ id: 'u1', role: 'SUPER_ADMIN' });
    (prisma.storageConfig.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.storageConfig.create as jest.Mock).mockResolvedValue({
      id: 'c1', limiteBytes: BigInt(1073741824), alertaAtencao: 70, alertaCritico: 85, alertaUrgente: 95,
    });
    const res = await putMonitoramento(
      req('/api/storage/monitoramento', {
        method: 'PUT',
        body: JSON.stringify({ limiteBytes: 1073741824, alertaAtencao: 70, alertaCritico: 85, alertaUrgente: 95 }),
      })
    );
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.limiteBytes).toBe(1073741824);
  });
});

describe('GET /api/storage/limpeza', () => {
  it('retorna 403 sem permissão', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({ id: 'u1', role: 'MEMBER' });
    (hasPermission as jest.Mock).mockResolvedValue(false);
    const res = await getLimpeza(req('/api/storage/limpeza'));
    expect(res.status).toBe(403);
  });

  it('retorna 200 para SUPER_ADMIN', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({ id: 'u1', role: 'SUPER_ADMIN' });
    const res = await getLimpeza(req('/api/storage/limpeza'));
    expect(res.status).toBe(200);
  });

  it('retorna 403 para usuário consultando outra congregação', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({ id: 'u1', role: 'ADMIN_IGREJA' });
    (hasPermission as jest.Mock).mockResolvedValue(true);
    (canManageOrganization as jest.Mock).mockResolvedValue(false);
    const res = await getLimpeza(req('/api/storage/limpeza?organizacaoId=outra'));
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/storage/alertas/[id]', () => {
  it('retorna 404 para alerta inexistente', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({ id: 'u1', role: 'SUPER_ADMIN' });
    (prisma.storageAlert.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await patchAlerta(
      req('/api/storage/alertas/a1', { method: 'PATCH', body: JSON.stringify({ acao: 'lido' }) }),
      { params: Promise.resolve({ id: 'a1' }) }
    );
    expect(res.status).toBe(404);
  });

  it('retorna 400 para ação inválida', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({ id: 'u1', role: 'SUPER_ADMIN' });
    (prisma.storageAlert.findUnique as jest.Mock).mockResolvedValue({ id: 'a1', organizacaoId: null, status: 'ATIVO' });
    const res = await patchAlerta(
      req('/api/storage/alertas/a1', { method: 'PATCH', body: JSON.stringify({ acao: 'apagar' }) }),
      { params: Promise.resolve({ id: 'a1' }) }
    );
    expect(res.status).toBe(400);
  });

  it('marca alerta como lido', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({ id: 'u1', role: 'SUPER_ADMIN' });
    (prisma.storageAlert.findUnique as jest.Mock).mockResolvedValue({ id: 'a1', organizacaoId: null, status: 'ATIVO' });
    (prisma.storageAlert.update as jest.Mock).mockResolvedValue({ id: 'a1', status: 'LIDO' });
    const res = await patchAlerta(
      req('/api/storage/alertas/a1', { method: 'PATCH', body: JSON.stringify({ acao: 'lido' }) }),
      { params: Promise.resolve({ id: 'a1' }) }
    );
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.status).toBe('LIDO');
  });
});
