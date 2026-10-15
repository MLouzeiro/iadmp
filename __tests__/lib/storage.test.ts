/**
 * @jest-environment node
 */
// Testes do módulo de monitoramento de armazenamento (storage.ts)
// Usamos mocks isolados — sem banco real, sem Supabase real.

// ---- Mocks ----
const mockStoredFile = {
  findMany: jest.fn(),
  create: jest.fn(),
};
const mockStorageConfig = {
  findFirst: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};
const mockStorageMeasurement = {
  create: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
};
const mockStorageAlert = {
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
};

jest.mock('@/lib/prisma', () => ({
  prisma: {
    storedFile: mockStoredFile,
    storageConfig: mockStorageConfig,
    storageMeasurement: mockStorageMeasurement,
    storageAlert: mockStorageAlert,
  },
}));

jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: jest.fn(() => true),
  getSupabase: jest.fn(),
  SUPABASE_BUCKET: 'imagens',
}));

import {
  sanitizarNomeArquivo,
  coletarUso,
  obterConfigLimites,
  avaliarEAlertar,
  registrarAlertaNivel,
  gerarSugestoes,
  verificarEspacoAntesDeUpload,
  LIMITES_PADRAO,
  type NivelAlerta,
} from '@/lib/storage';

beforeEach(() => {
  jest.clearAllMocks();
  // Restaurar mock de Supabase configurado após clearAllMocks
  const { isSupabaseConfigured } = jest.requireMock('@/lib/supabase');
  (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
  // Padrão: sem config (usa LIMITES_PADRAO)
  mockStorageConfig.findFirst.mockResolvedValue(null);
  mockStorageMeasurement.findFirst.mockResolvedValue(null);
  mockStorageMeasurement.create.mockResolvedValue({});
  mockStorageAlert.findFirst.mockResolvedValue(null);
  mockStorageAlert.findMany.mockResolvedValue([]);
  mockStorageAlert.create.mockResolvedValue({});
  mockStorageAlert.update.mockResolvedValue({});
  mockStorageAlert.updateMany.mockResolvedValue({ count: 0 });
});

describe('sanitizarNomeArquivo', () => {
  it('remove acentos e caracteres perigosos', () => {
    expect(sanitizarNomeArquivo('Mãe de Deus (v2).jpg')).toBe('Mae_de_Deus_v2_.jpg');
  });
  it('remove espaços e hífens extras', () => {
    expect(sanitizarNomeArquivo('  foto  final.png')).toBe('foto_final.png');
  });
  it('limita o tamanho do nome', () => {
    const longo = 'a'.repeat(200) + '.jpg';
    expect(sanitizarNomeArquivo(longo).length).toBeLessThanOrEqual(100);
  });
});

describe('LIMITES_PADRAO', () => {
  it('define 70/85/95 e 1 GB', () => {
    expect(LIMITES_PADRAO.alertaAtencao).toBe(70);
    expect(LIMITES_PADRAO.alertaCritico).toBe(85);
    expect(LIMITES_PADRAO.alertaUrgente).toBe(95);
    expect(LIMITES_PADRAO.limiteBytes).toBe(1024 * 1024 * 1024);
  });
});

describe('coletarUso', () => {
  it('retorna CONFIG_INCOMPLETA quando Supabase não configurado', async () => {
    const { isSupabaseConfigured } = jest.requireMock('@/lib/supabase');
    (isSupabaseConfigured as jest.Mock).mockReturnValue(false);

    const uso = await coletarUso('org1');
    expect(uso.integraao).toBe('CONFIG_INCOMPLETA');
    expect(uso.totalBytes).toBe(0);
    expect(uso.observacao).toContain('não configurado');
  });

  it('retorna NORMAL com inventário vazio (não assume falha)', async () => {
    mockStoredFile.findMany.mockResolvedValue([]);
    const uso = await coletarUso('org1');
    expect(uso.integraao).toBe('NORMAL');
    expect(uso.totalBytes).toBe(0);
    expect(uso.fileCount).toBe(0);
    expect(uso.observacao).toContain('Inventário vazio');
  });

  it('soma tamanhos e conta arquivos por bucket', async () => {
    mockStoredFile.findMany.mockResolvedValue([
      { sizeBytes: 1000, bucket: 'imagens' },
      { sizeBytes: 2500, bucket: 'imagens' },
      { sizeBytes: 500, bucket: 'docs' },
    ]);
    const uso = await coletarUso('org1');
    expect(uso.totalBytes).toBe(4000);
    expect(uso.fileCount).toBe(3);
    expect(uso.buckets['imagens']).toEqual({ bytes: 3500, count: 2 });
    expect(uso.buckets['docs']).toEqual({ bytes: 500, count: 1 });
  });

  it('registra medição histórica', async () => {
    mockStoredFile.findMany.mockResolvedValue([{ sizeBytes: 100, bucket: 'imagens' }]);
    await coletarUso('org1');
    expect(mockStorageMeasurement.create).toHaveBeenCalled();
  });

  it('retorna ERRO quando consulta falha (não assume zero)', async () => {
    mockStoredFile.findMany.mockRejectedValue(new Error('db down'));
    const uso = await coletarUso('org1');
    expect(uso.integraao).toBe('ERRO');
    expect(uso.observacao).toContain('db down');
  });
});

describe('obterConfigLimites', () => {
  it('retorna LIMITES_PADRAO quando não há config', async () => {
    const cfg = await obterConfigLimites('org1');
    expect(cfg).toEqual(LIMITES_PADRAO);
  });
  it('retorna config global quando existe', async () => {
    mockStorageConfig.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      limiteBytes: BigInt(2 * 1024 ** 3),
      alertaAtencao: 60,
      alertaCritico: 80,
      alertaUrgente: 90,
    });
    const cfg = await obterConfigLimites('org1');
    expect(cfg.limiteBytes).toBe(2 * 1024 ** 3);
    expect(cfg.alertaAtencao).toBe(60);
  });
});

describe('avaliarEAlertar', () => {
  function prepararUso(pct: number) {
    const total = Math.round(LIMITES_PADRAO.limiteBytes * (pct / 100));
    mockStoredFile.findMany.mockResolvedValue([{ sizeBytes: total, bucket: 'imagens' }]);
  }

  it('não cria alerta abaixo de 70%', async () => {
    prepararUso(50);
    const r = await avaliarEAlertar('org1');
    expect(r.nivel).toBe('NORMAL');
    expect(r.alertaCriado).toBe(false);
    expect(mockStorageAlert.create).not.toHaveBeenCalled();
  });

  it('cria alerta ATENCAO aos 70%', async () => {
    prepararUso(72);
    const r = await avaliarEAlertar('org1');
    expect(r.nivel).toBe('ATENCAO');
    expect(r.alertaCriado).toBe(true);
    expect(mockStorageAlert.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ nivel: 70, status: 'ATIVO' }) })
    );
  });

  it('cria alerta CRITICO aos 85%', async () => {
    prepararUso(86);
    const r = await avaliarEAlertar('org1');
    expect(r.nivel).toBe('CRITICO');
    expect(mockStorageAlert.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ nivel: 85 }) })
    );
  });

  it('cria alerta URGENTE aos 95%', async () => {
    prepararUso(96);
    const r = await avaliarEAlertar('org1');
    expect(r.nivel).toBe('URGENTE');
    expect(mockStorageAlert.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ nivel: 95 }) })
    );
  });

  it('cria alerta CHEIO aos 100%', async () => {
    prepararUso(100);
    const r = await avaliarEAlertar('org1');
    expect(r.nivel).toBe('CHEIO');
    expect(mockStorageAlert.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ nivel: 100 }) })
    );
  });

  it('retorna INDISPONIVEL quando uso falha', async () => {
    mockStoredFile.findMany.mockRejectedValue(new Error('fail'));
    const r = await avaliarEAlertar('org1');
    expect(r.nivel).toBe('INDISPONIVEL');
    expect(r.alertaCriado).toBe(false);
  });

  it('não cria alerta duplicado quando já existe ATIVO do mesmo nível', async () => {
    prepararUso(72);
    mockStorageAlert.findFirst.mockResolvedValue({ id: 'a1', nivel: 70, status: 'ATIVO' });
    const r = await avaliarEAlertar('org1');
    expect(r.alertaCriado).toBe(false);
    expect(mockStorageAlert.create).not.toHaveBeenCalled();
  });

  it('marca alertas maiores como RESOLVIDO quando há recuperação', async () => {
    // Uso voltou a 50% (NORMAL)
    prepararUso(50);
    const r = await avaliarEAlertar('org1');
    expect(r.nivel).toBe('NORMAL');
    expect(mockStorageAlert.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ATIVO' }),
        data: expect.objectContaining({ status: 'RESOLVIDO' }),
      })
    );
  });
});

describe('registrarAlertaNivel', () => {
  it('não cria duplicado se já existe ATIVO do mesmo nível', async () => {
    mockStorageAlert.findFirst.mockResolvedValue({ id: 'a1' });
    await registrarAlertaNivel('org1', 70, 't', 'm', ['s']);
    expect(mockStorageAlert.create).not.toHaveBeenCalled();
  });

  it('cria alerta quando não existe duplicado', async () => {
    mockStorageAlert.findFirst.mockResolvedValue(null);
    await registrarAlertaNivel('org1', 85, 'titulo', 'mensagem', ['sugestao']);
    expect(mockStorageAlert.create).toHaveBeenCalled();
  });

  it('marca alertas maiores como RESOLVIDO antes de criar novo', async () => {
    mockStorageAlert.findFirst.mockResolvedValue(null);
    await registrarAlertaNivel('org1', 70, 't', 'm', []);
    expect(mockStorageAlert.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ nivel: { gt: 70 }, status: 'ATIVO' }),
      })
    );
  });
});

describe('gerarSugestoes', () => {
  const uso = { totalBytes: 0, fileCount: 0, buckets: {}, fonte: 'INVENTARIO' as const, ultimaMedicao: null, integraao: 'NORMAL' as const };

  it('ATENCAO sugere identificar imagens grandes e revisar banners', () => {
    const s = gerarSugestoes('ATENCAO' as NivelAlerta, uso, LIMITES_PADRAO);
    expect(s.length).toBeGreaterThan(0);
    expect(s.join(' ')).toContain('imagens');
  });

  it('URGENTE avisa que uploads podem falhar', () => {
    const s = gerarSugestoes('URGENTE' as NivelAlerta, uso, LIMITES_PADRAO);
    expect(s.join(' ')).toContain('uploads podem falhar');
  });

  it('CHEIO orienta revisão e não exclusão automática', () => {
    const s = gerarSugestoes('CHEIO' as NivelAlerta, uso, LIMITES_PADRAO);
    expect(s.join(' ')).toContain('urgente');
    expect(s.join(' ')).toContain('automaticamente');
  });
});

describe('verificarEspacoAntesDeUpload', () => {
  it('bloqueia quando pct >= 100', async () => {
    mockStoredFile.findMany.mockResolvedValue([
      { sizeBytes: LIMITES_PADRAO.limiteBytes, bucket: 'imagens' },
    ]);
    const r = await verificarEspacoAntesDeUpload('org1');
    expect(r.permite).toBe(false);
    expect(r.nivel).toBe('CHEIO');
    expect(r.motivo).toContain('cheio');
  });

  it('permite com aviso quando URGENTE (>=95)', async () => {
    const total = Math.round(LIMITES_PADRAO.limiteBytes * 0.96);
    mockStoredFile.findMany.mockResolvedValue([{ sizeBytes: total, bucket: 'imagens' }]);
    const r = await verificarEspacoAntesDeUpload('org1');
    expect(r.permite).toBe(true);
    expect(r.nivel).toBe('URGENTE');
    expect(r.motivo).toContain('urgente');
  });

  it('permite normalmente abaixo do limite', async () => {
    const total = Math.round(LIMITES_PADRAO.limiteBytes * 0.3);
    mockStoredFile.findMany.mockResolvedValue([{ sizeBytes: total, bucket: 'imagens' }]);
    const r = await verificarEspacoAntesDeUpload('org1');
    expect(r.permite).toBe(true);
    expect(r.nivel).toBeUndefined();
  });

  it('não bloqueia quando monitoramento indisponível (política segura)', async () => {
    mockStoredFile.findMany.mockRejectedValue(new Error('fail'));
    const r = await verificarEspacoAntesDeUpload('org1');
    expect(r.permite).toBe(true);
  });
});
