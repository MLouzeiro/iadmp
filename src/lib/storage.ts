import { prisma } from '@/lib/prisma';
import { getSupabase, isSupabaseConfigured, SUPABASE_BUCKET } from '@/lib/supabase';

// ---------- Tipos ----------
export type NivelAlerta = 'NORMAL' | 'ATENCAO' | 'CRITICO' | 'URGENTE' | 'CHEIO' | 'INDISPONIVEL';

export interface ResumoUso {
  totalBytes: number;
  fileCount: number;
  buckets: Record<string, { bytes: number; count: number }>;
  fonte: 'INVENTARIO' | 'API_OFICIAL';
  ultimaMedicao: string | null;
  integraao: 'NORMAL' | 'INDISPONIVEL' | 'CONFIG_INCOMPLETA' | 'ERRO';
  observacao?: string;
}

export interface ConfigLimites {
  limiteBytes: number;
  alertaAtencao: number;
  alertaCritico: number;
  alertaUrgente: number;
}

export const LIMITES_PADRAO: ConfigLimites = {
  limiteBytes: 1024 * 1024 * 1024, // 1 GB — configurável, NÃO é cota real do provedor
  alertaAtencao: 70,
  alertaCritico: 85,
  alertaUrgente: 95,
};

// ---------- Upload ----------
const MIME_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];
const TAMANHO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB por arquivo

export interface ResultadoUpload {
  ok: boolean;
  url?: string;
  path?: string;
  sizeBytes?: number;
  erro?: string;
  codigo?: 'SEM_ESPACO' | 'TIPO_INVALIDO' | 'GRANDE_DEMAIS' | 'ERRO_INTERNO' | 'NAO_CONFIGURADO';
}

export function sanitizarNomeArquivo(nome: string): string {
  return nome
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100);
}

export async function verificarEspacoAntesDeUpload(
  organizacaoId: string
): Promise<{ permite: boolean; motivo?: string; nivel?: NivelAlerta }> {
  const uso = await coletarUso(organizacaoId);
  if (uso.integraao !== 'NORMAL' && uso.integraao !== 'CONFIG_INCOMPLETA') {
    // Monitoramento indisponível: política segura = permitir mas registrar.
    // Não afirmamos falsamente que há espaço.
    return { permite: true };
  }

  const config = await obterConfigLimites(organizacaoId);
  const pct = config.limiteBytes > 0 ? (uso.totalBytes / config.limiteBytes) * 100 : 0;

  if (pct >= 100) {
    return {
      permite: false,
      motivo: 'Armazenamento cheio. Novos uploads podem falhar. Libere espaço antes de continuar.',
      nivel: 'CHEIO',
    };
  }
  if (pct >= config.alertaUrgente) {
    return {
      permite: true,
      motivo: 'Armazenamento em nível urgente (≥95%). Considere liberar espaço antes de novos uploads não essenciais.',
      nivel: 'URGENTE',
    };
  }
  return { permite: true };
}

export async function uploadArquivo(params: {
  organizacaoId: string;
  arquivo: File;
  pasta?: string;
  entityTipo?: string;
  entityId?: string;
  uploadedById?: string;
}): Promise<ResultadoUpload> {
  const { organizacaoId, arquivo, pasta = 'geral', entityTipo, entityId, uploadedById } = params;

  if (!isSupabaseConfigured()) {
    return { ok: false, erro: 'Supabase Storage não configurado.', codigo: 'NAO_CONFIGURADO' };
  }

  // Validação de tipo (não confiar só na extensão)
  if (!MIME_PERMITIDOS.includes(arquivo.type)) {
    return {
      ok: false,
      erro: `Tipo de arquivo não permitido: ${arquivo.type || 'desconhecido'}. Permitidos: JPEG, PNG, WebP, GIF, SVG.`,
      codigo: 'TIPO_INVALIDO',
    };
  }

  // Validação de tamanho
  if (arquivo.size > TAMANHO_MAX_BYTES) {
    return {
      ok: false,
      erro: `Arquivo muito grande (${(arquivo.size / 1024 / 1024).toFixed(1)} MB). Máximo: ${TAMANHO_MAX_BYTES / 1024 / 1024} MB.`,
      codigo: 'GRANDE_DEMAIS',
    };
  }

  // Bloqueio se armazenamento cheio
  const espaco = await verificarEspacoAntesDeUpload(organizacaoId);
  if (!espaco.permite) {
    return { ok: false, erro: espaco.motivo, codigo: 'SEM_ESPACO' };
  }

  try {
    const supabase = getSupabase();
    const nomeSeguro = sanitizarNomeArquivo(arquivo.name || 'arquivo');
    const ext = nomeSeguro.includes('.') ? nomeSeguro.slice(nomeSeguro.lastIndexOf('.')) : '';
    const base = nomeSeguro.replace(/\.[^.]+$/, '');
    const path = `${organizacaoId}/${pasta}/${Date.now()}_${base}${ext}`;

    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(path, buffer, { contentType: arquivo.type, upsert: false });

    if (error) {
      // Erro típico de cota esgotada
      const msg = error.message || '';
      if (msg.toLowerCase().includes('exceeded') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('limit')) {
        await registrarAlertaNivel(organizacaoId, 100, 'Armazenamento cheio (falha no upload)', 'O upload falhou por possível esgotamento de cota no provedor.', ['Verifique arquivos grandes e duplicados', 'Considere comprimir imagens', 'Não é recomendado excluir automaticamente']);
        return { ok: false, erro: 'Upload falhou: possível esgotamento de espaço no armazenamento.', codigo: 'SEM_ESPACO' };
      }
      return { ok: false, erro: `Erro no upload: ${msg}`, codigo: 'ERRO_INTERNO' };
    }

    const urlPublica = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(data.path).data.publicUrl;

    // Registrar no inventário (StoredFile)
    try {
      await prisma.storedFile.create({
        data: {
          organizacaoId,
          bucket: SUPABASE_BUCKET,
          path: data.path,
          fileName: arquivo.name || nomeSeguro,
          sizeBytes: arquivo.size,
          contentType: arquivo.type,
          etag: data.id || null,
          entityTipo: entityTipo || null,
          entityId: entityId || null,
          uploadedById: uploadedById || null,
        },
      });
    } catch {
      // Upload ok no Supabase mas falhou registro — não bloquear, mas logar
      console.warn('[storage] Upload ok mas falhou registrar StoredFile para', data.path);
    }

    return { ok: true, url: urlPublica, path: data.path, sizeBytes: arquivo.size };
  } catch (e) {
    return { ok: false, erro: `Erro interno no upload: ${(e as Error).message}`, codigo: 'ERRO_INTERNO' };
  }
}

// ---------- Coleta de uso ----------
export async function obterConfigLimites(organizacaoId?: string): Promise<ConfigLimites> {
  try {
    // Tenta config específica da organização, senão global, senão padrão
    const especifica = organizacaoId
      ? await prisma.storageConfig.findFirst({ where: { organizacaoId, ativo: true } })
      : null;
    const global = await prisma.storageConfig.findFirst({ where: { organizacaoId: null, ativo: true } });
    const cfg = especifica || global;
    if (!cfg) return LIMITES_PADRAO;
    return {
      limiteBytes: Number(cfg.limiteBytes),
      alertaAtencao: cfg.alertaAtencao,
      alertaCritico: cfg.alertaCritico,
      alertaUrgente: cfg.alertaUrgente,
    };
  } catch {
    return LIMITES_PADRAO;
  }
}

export async function coletarUso(organizacaoId?: string): Promise<ResumoUso> {
  const vazio: ResumoUso = {
    totalBytes: 0,
    fileCount: 0,
    buckets: {},
    fonte: 'INVENTARIO',
    ultimaMedicao: null,
    integraao: 'INDISPONIVEL',
  };

  if (!isSupabaseConfigured()) {
    return { ...vazio, integraao: 'CONFIG_INCOMPLETA', observacao: 'Supabase não configurado. Defina as variáveis de ambiente.' };
  }

  try {
    const where = organizacaoId ? { organizacaoId, ativo: true } : { ativo: true };
    const files = await prisma.storedFile.findMany({
      where,
      select: { sizeBytes: true, bucket: true },
    });

    if (files.length === 0) {
      // Sem arquivos registrados — pode ser real (novo) ou falha de leitura anterior.
      // Verificamos última medição para distinguir.
      const ultima = await prisma.storageMeasurement.findFirst({
        where: organizacaoId ? { organizacaoId } : { organizacaoId: null },
        orderBy: { medidoEm: 'desc' },
      });
      return {
        totalBytes: 0,
        fileCount: 0,
        buckets: {},
        fonte: 'INVENTARIO',
        ultimaMedicao: ultima?.medidoEm.toISOString() || null,
        integraao: 'NORMAL',
        observacao: 'Inventário vazio (nenhum arquivo registrado no sistema).',
      };
    }

    const buckets: Record<string, { bytes: number; count: number }> = {};
    let total = 0;
    for (const f of files) {
      total += f.sizeBytes;
      if (!buckets[f.bucket]) buckets[f.bucket] = { bytes: 0, count: 0 };
      buckets[f.bucket].bytes += f.sizeBytes;
      buckets[f.bucket].count += 1;
    }

    // Registrar medição histórica
    try {
      await prisma.storageMeasurement.create({
        data: {
          organizacaoId: organizacaoId || null,
          totalBytes: BigInt(total),
          fileCount: files.length,
          buckets,
          fonte: 'INVENTARIO',
        },
      });
    } catch {
      // Não bloquear se falhar registrar histórico
    }

    return {
      totalBytes: total,
      fileCount: files.length,
      buckets,
      fonte: 'INVENTARIO',
      ultimaMedicao: new Date().toISOString(),
      integraao: 'NORMAL',
      observacao: 'Uso calculado a partir do inventário interno (StoredFile). Pode não refletir arquivos fora do sistema.',
    };
  } catch (e) {
    return { ...vazio, integraao: 'ERRO', observacao: `Falha ao consultar uso: ${(e as Error).message}` };
  }
}

// ---------- Alertas ----------
function nivelDoPercentual(pct: number, cfg: ConfigLimites): NivelAlerta | null {
  if (pct >= 100) return 'CHEIO';
  if (pct >= cfg.alertaUrgente) return 'URGENTE';
  if (pct >= cfg.alertaCritico) return 'CRITICO';
  if (pct >= cfg.alertaAtencao) return 'ATENCAO';
  return null;
}

function nivelNumerico(n: NivelAlerta): number {
  switch (n) {
    case 'ATENCAO': return 70;
    case 'CRITICO': return 85;
    case 'URGENTE': return 95;
    case 'CHEIO': return 100;
    default: return 0;
  }
}

export function gerarSugestoes(nivel: NivelAlerta, uso: ResumoUso, config: ConfigLimites): string[] {
  const pct = config.limiteBytes > 0 ? Math.round((uso.totalBytes / config.limiteBytes) * 100) : 0;
  switch (nivel) {
    case 'ATENCAO':
      return [
        'Identifique imagens grandes no módulo de limpeza.',
        'Revise banners antigos e versões duplicadas.',
        'Comprima imagens antes de novos uploads (WebP é mais leve).',
        `Consumo atual: ${pct}% de ${(config.limiteBytes / 1024 / 1024 / 1024).toFixed(2)} GB configurados.`,
      ];
    case 'CRITICO':
      return [
        'Priorize compressão de imagens já enviadas.',
        'Arquive arquivos antigos que não são mais exibidos.',
        uso.fileCount > 0
          ? `Há ${uso.fileCount} arquivos registrados; identifique os maiores antes de remover.`
          : 'Verifique a distribuição por congregação quando disponível.',
        'Se houver histórico suficiente, avalie a tendência de crescimento.',
      ];
    case 'URGENTE':
      return [
        'Novos uploads podem falhar se a cota se esgotar.',
        'Considere suspender uploads não essenciais temporariamente.',
        'Revise arquivos dispensáveis antes de removê-los.',
        'Avalie otimização, arquivamento ou outro serviço de armazenamento (pode gerar cobrança — requer autorização).',
        'Não migre arquivos automaticamente.',
      ];
    case 'CHEIO':
      return [
        'Alerta urgente: armazenamento cheio ou possível esgotamento.',
        'Novos uploads provavelmente falharão.',
        'Revise arquivos grandes, duplicados e antigos.',
        'Procedimento seguro: primeiro diagnostique, depois remova com confirmação — nunca exclua automaticamente.',
        'Mudar de plano ou serviço pode gerar cobrança e exige autorização.',
      ];
    default:
      return [];
  }
}

export async function registrarAlertaNivel(
  organizacaoId: string | null,
  nivel: number,
  titulo: string,
  mensagem: string,
  sugestoes: string[],
  fonte = 'INVENTARIO'
): Promise<void> {
  // Evitar duplicado: se já existe ATIVO com mesmo nível e organização, não criar novo
  const existente = await prisma.storageAlert.findFirst({
    where: { organizacaoId, nivel, status: 'ATIVO' },
  });
  if (existente) return;

  // Registrar recuperação: se havia alerta ATIVO de nível maior, marcar como RESOLVIDO
  await prisma.storageAlert.updateMany({
    where: { organizacaoId, status: 'ATIVO', nivel: { gt: nivel } },
    data: { status: 'RESOLVIDO', resolvidoEm: new Date() },
  });

  await prisma.storageAlert.create({
    data: {
      organizacaoId,
      nivel,
      titulo,
      mensagem,
      sugestoes,
      fonte,
      status: 'ATIVO',
    },
  });
}

export async function avaliarEAlertar(organizacaoId?: string): Promise<{ nivel: NivelAlerta; pct: number; alertaCriado: boolean }> {
  const uso = await coletarUso(organizacaoId);
  const config = await obterConfigLimites(organizacaoId);

  if (uso.integraao !== 'NORMAL') {
    return { nivel: 'INDISPONIVEL', pct: 0, alertaCriado: false };
  }

  const pct = config.limiteBytes > 0 ? (uso.totalBytes / config.limiteBytes) * 100 : 0;
  const nivel = nivelDoPercentual(pct, config);

  let alertaCriado = false;
  if (nivel) {
    const n = nivelNumerico(nivel);
    const antes = await prisma.storageAlert.findFirst({
      where: { organizacaoId: organizacaoId || null, nivel: n, status: 'ATIVO' },
    });
    if (!antes) {
      await registrarAlertaNivel(
        organizacaoId || null,
        n,
        `Armazenamento em nível ${nivel} (${Math.round(pct)}%)`,
        `O uso do armazenamento atingiu ${Math.round(pct)}% do limite configurado.`,
        gerarSugestoes(nivel, uso, config)
      );
      alertaCriado = true;
    }
  } else {
    // Recuperação: marcar alertas ATIVO como RESOLVIDO se voltou a normal
    await prisma.storageAlert.updateMany({
      where: { organizacaoId: organizacaoId || null, status: 'ATIVO' },
      data: { status: 'RESOLVIDO', resolvidoEm: new Date() },
    });
  }

  return { nivel: nivel || 'NORMAL', pct: Math.round(pct * 10) / 10, alertaCriado };
}

// ---------- Limpeza (diagnóstico) ----------
export interface CandidatoLimpeza {
  id: string;
  fileName: string;
  sizeBytes: number;
  path: string;
  bucket: string;
  createdAt: string;
  organizacaoId: string;
  organizacaoNome: string;
  entityTipo: string | null;
  entityId: string | null;
  possivelDuplicado: boolean;
}

export async function listarCandidatosLimpeza(
  organizacaoId?: string,
  limite = 50
): Promise<CandidatoLimpeza[]> {
  const where = organizacaoId ? { organizacaoId, ativo: true } : { ativo: true };
  const files = await prisma.storedFile.findMany({
    where,
    include: { organizacao: { select: { nome: true } } },
    orderBy: { sizeBytes: 'desc' },
    take: limite,
  });

  // Detectar duplicados por nome+size
  const contagem = new Map<string, number>();
  for (const f of files) {
    const key = `${f.fileName}:${f.sizeBytes}`;
    contagem.set(key, (contagem.get(key) || 0) + 1);
  }

  return files.map((f) => ({
    id: f.id,
    fileName: f.fileName,
    sizeBytes: f.sizeBytes,
    path: f.path,
    bucket: f.bucket,
    createdAt: f.createdAt.toISOString(),
    organizacaoId: f.organizacaoId,
    organizacaoNome: f.organizacao.nome,
    entityTipo: f.entityTipo,
    entityId: f.entityId,
    possivelDuplicado: (contagem.get(`${f.fileName}:${f.sizeBytes}`) || 0) > 1,
  }));
}
