import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hasPermission, canManageOrganization } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { coletarUso, obterConfigLimites, avaliarEAlertar, type ResumoUso } from '@/lib/storage';
import { writeAudit } from '@/lib/audit';

// GET /api/storage/monitoramento — coleta uso + avalia alertas (sob demanda)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const podeVerTudo = user.role === 'SUPER_ADMIN';
    if (!podeVerTudo && !(await hasPermission(user.id, 'configuracoes', 'ver'))) {
      return NextResponse.json({ error: 'Sem permissão para ver monitoramento de armazenamento.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const organizacaoIdParam = searchParams.get('organizacaoId');

    // Escopo: SUPER_ADMIN pode ver global ou específica; outros só das vinculadas
    let escopoOrg: string | undefined;
    if (organizacaoIdParam) {
      if (!podeVerTudo && !(await canManageOrganization(user.id, organizacaoIdParam))) {
        return NextResponse.json({ error: 'Sem permissão para esta organização.' }, { status: 403 });
      }
      escopoOrg = organizacaoIdParam;
    }

    const [uso, config, avaliacao] = await Promise.all([
      coletarUso(escopoOrg),
      obterConfigLimites(escopoOrg),
      avaliarEAlertar(escopoOrg),
    ]);

    // Histórico de medições (últimas 30)
    const historico = await prisma.storageMeasurement.findMany({
      where: escopoOrg ? { organizacaoId: escopoOrg } : { organizacaoId: null },
      orderBy: { medidoEm: 'desc' },
      take: 30,
    });

    // Alertas ativos + recentes
    const alertas = await prisma.storageAlert.findMany({
      where: escopoOrg ? { organizacaoId: escopoOrg } : { organizacaoId: null },
      orderBy: { emitidoEm: 'desc' },
      take: 20,
    });

    // Arquivos maiores
    const maiores = await prisma.storedFile.findMany({
      where: escopoOrg ? { organizacaoId: escopoOrg, ativo: true } : { ativo: true },
      orderBy: { sizeBytes: 'desc' },
      take: 10,
      select: { id: true, fileName: true, sizeBytes: true, path: true, bucket: true, createdAt: true, organizacaoId: true, organizacao: { select: { nome: true } } },
    });

    return NextResponse.json({
      uso: serializarUso(uso),
      config,
      nivel: avaliacao.nivel,
      pct: avaliacao.pct,
      historico: historico.map((h) => ({
        id: h.id,
        totalBytes: Number(h.totalBytes),
        fileCount: h.fileCount,
        fonte: h.fonte,
        medidoEm: h.medidoEm.toISOString(),
      })),
      alertas: alertas.map((a) => ({
        id: a.id,
        nivel: a.nivel,
        titulo: a.titulo,
        mensagem: a.mensagem,
        sugestoes: a.sugestoes,
        fonte: a.fonte,
        status: a.status,
        emitidoEm: a.emitidoEm.toISOString(),
        lidoEm: a.lidoEm?.toISOString() || null,
        resolvidoEm: a.resolvidoEm?.toISOString() || null,
      })),
      maiores: maiores.map((m) => ({
        id: m.id,
        fileName: m.fileName,
        sizeBytes: m.sizeBytes,
        path: m.path,
        bucket: m.bucket,
        createdAt: m.createdAt.toISOString(),
        organizacaoId: m.organizacaoId,
        organizacaoNome: m.organizacao.nome,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: `Erro ao monitorar armazenamento: ${(e as Error).message}` }, { status: 500 });
  }
}

// PUT /api/storage/monitoramento — atualizar config de limites (SUPER_ADMIN)
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Apenas SUPER_ADMIN pode alterar limites de armazenamento.' }, { status: 403 });
    }

    const body = await request.json();
    const { organizacaoId, limiteBytes, alertaAtencao, alertaCritico, alertaUrgente } = body;

    // Validação
    if (typeof limiteBytes !== 'number' || limiteBytes <= 0) {
      return NextResponse.json({ error: 'limiteBytes deve ser um número positivo.' }, { status: 400 });
    }
    if (limiteBytes < 1024 * 1024) {
      return NextResponse.json({ error: 'limiteBytes deve ser ao menos 1 MB.' }, { status: 400 });
    }
    for (const [campo, valor] of [['alertaAtencao', alertaAtencao], ['alertaCritico', alertaCritico], ['alertaUrgente', alertaUrgente]] as const) {
      if (typeof valor === 'number' && (valor < 1 || valor > 100)) {
        return NextResponse.json({ error: `${campo} deve estar entre 1 e 100.` }, { status: 400 });
      }
    }
    if (typeof alertaAtencao === 'number' && typeof alertaCritico === 'number' && alertaAtencao >= alertaCritico) {
      return NextResponse.json({ error: 'alertaAtencao deve ser menor que alertaCritico.' }, { status: 400 });
    }
    if (typeof alertaCritico === 'number' && typeof alertaUrgente === 'number' && alertaCritico >= alertaUrgente) {
      return NextResponse.json({ error: 'alertaCritico deve ser menor que alertaUrgente.' }, { status: 400 });
    }

    const dados = {
      limiteBytes: BigInt(Math.round(limiteBytes)),
      alertaAtencao: typeof alertaAtencao === 'number' ? alertaAtencao : undefined,
      alertaCritico: typeof alertaCritico === 'number' ? alertaCritico : undefined,
      alertaUrgente: typeof alertaUrgente === 'number' ? alertaUrgente : undefined,
    };
    // Remove undefined
    Object.keys(dados).forEach((k) => dados[k as keyof typeof dados] === undefined && delete dados[k as keyof typeof dados]);

    let config;
    const existente = await prisma.storageConfig.findFirst({
      where: { organizacaoId: organizacaoId || null, ativo: true },
    });
    if (existente) {
      config = await prisma.storageConfig.update({ where: { id: existente.id }, data: dados });
    } else {
      config = await prisma.storageConfig.create({
        data: { organizacaoId: organizacaoId || null, ...dados },
      });
    }

    await writeAudit({
      userId: user.id,
      organizacaoId: organizacaoId || null,
      acao: 'ATUALIZAR_CONFIG_STORAGE',
      entidade: 'StorageConfig',
      entidadeId: config.id,
      depois: { limiteBytes: Number(config.limiteBytes), alertaAtencao: config.alertaAtencao, alertaCritico: config.alertaCritico, alertaUrgente: config.alertaUrgente },
      req: request,
    });

    return NextResponse.json({
      id: config.id,
      limiteBytes: Number(config.limiteBytes),
      alertaAtencao: config.alertaAtencao,
      alertaCritico: config.alertaCritico,
      alertaUrgente: config.alertaUrgente,
    });
  } catch (e) {
    return NextResponse.json({ error: `Erro ao salvar config: ${(e as Error).message}` }, { status: 500 });
  }
}

function serializarUso(uso: ResumoUso) {
  return {
    totalBytes: uso.totalBytes,
    fileCount: uso.fileCount,
    buckets: uso.buckets,
    fonte: uso.fonte,
    ultimaMedicao: uso.ultimaMedicao,
    integraao: uso.integraao,
    observacao: uso.observacao,
  };
}
