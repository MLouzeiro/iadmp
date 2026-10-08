import { prisma } from '@/lib/prisma';

/**
 * Core de indicadores — FONTE ÚNICA de métricas do painel.
 * `GET /api/dashboard`, `GET /api/comunicacao/dashboard` e `GET /api/gestao/indicadores`
 * delegam para cá para não haver duas fontes de verdade.
 */

export type TipoPeriodo =
  | 'hoje'
  | 'ontem'
  | '7d'
  | '30d'
  | 'mes_atual'
  | 'mes_anterior'
  | 'trimestre'
  | 'semestre'
  | 'ano'
  | 'personalizado';

export interface Janela {
  inicio: Date;
  fim: Date;
}

export interface Periodo {
  tipo: TipoPeriodo;
  label: string;
  atual: Janela;
  anterior: Janela;
}

export interface FiltrosIndicador {
  organizacaoIds: string[];
  congregacaoId?: string | null;
  eventoId?: string | null;
  categoria?: string | null;
  status?: string | null;
}

function inicioDoDia(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function fimDoDia(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function somaDias(d: Date, dias: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + dias);
  return c;
}

function somaMeses(d: Date, meses: number) {
  return new Date(d.getFullYear(), d.getMonth() + meses, 1);
}

function fimDoMes(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Interpreta `YYYY-MM-DD` como data LOCAL (e nǜo UTC), para que
 * `dataInicio=2026-01-01` signifique a meia-noite do dia 1 no fuso do servidor/usuǭrio.
 * Reexportado de `@/lib/datas` (fonte única de helpers de data).
 */
export { parseDataLocal } from './datas';
import { parseDataLocal } from './datas';


/**
 * Resolve a janela atual e a janela anterior (mesma duração, imediatamente anterior).
 */
export function resolvePeriodo(
  tipo: TipoPeriodo = 'mes_atual',
  personalizado?: { dataInicio?: string; dataFim?: string }
): Periodo {
  const hoje = new Date();
  let inicio: Date;
  let fim: Date;
  let label: string;

  switch (tipo) {
    case 'hoje':
      inicio = inicioDoDia(hoje);
      fim = fimDoDia(hoje);
      label = 'Hoje';
      break;
    case 'ontem':
      inicio = inicioDoDia(somaDias(hoje, -1));
      fim = fimDoDia(somaDias(hoje, -1));
      label = 'Ontem';
      break;
    case '7d':
      inicio = inicioDoDia(somaDias(hoje, -6));
      fim = fimDoDia(hoje);
      label = 'Últimos 7 dias';
      break;
    case '30d':
      inicio = inicioDoDia(somaDias(hoje, -29));
      fim = fimDoDia(hoje);
      label = 'Últimos 30 dias';
      break;
    case 'mes_anterior':
      inicio = somaMeses(hoje, -1);
      fim = fimDoMes(somaMeses(hoje, -1));
      label = 'Mês anterior';
      break;
    case 'trimestre': {
      const t = Math.floor(hoje.getMonth() / 3);
      inicio = new Date(hoje.getFullYear(), t * 3, 1);
      fim = fimDoDia(hoje);
      label = 'Trimestre';
      break;
    }
    case 'semestre': {
      const s = hoje.getMonth() < 6 ? 0 : 6;
      inicio = new Date(hoje.getFullYear(), s, 1);
      fim = fimDoDia(hoje);
      label = 'Semestre';
      break;
    }
    case 'ano':
      inicio = new Date(hoje.getFullYear(), 0, 1);
      fim = fimDoDia(hoje);
      label = 'Ano';
      break;
    case 'personalizado':
    case 'mes_atual':
    default: {
      if (tipo === 'personalizado' && personalizado?.dataInicio) {
        inicio = inicioDoDia(parseDataLocal(personalizado.dataInicio));
        fim = personalizado?.dataFim
          ? fimDoDia(parseDataLocal(personalizado.dataFim))
          : fimDoDia(hoje);
        label = 'Período personalizado';
      } else {
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        fim = fimDoDia(hoje);
        label = 'Mês atual';
      }
      break;
    }
  }

  const duracao = fim.getTime() - inicio.getTime();
  const anteriorFim = new Date(inicio.getTime() - 1);
  const anteriorInicio = new Date(anteriorFim.getTime() - duracao);

  return {
    tipo,
    label,
    atual: { inicio, fim },
    anterior: { inicio: anteriorInicio, fim: anteriorFim },
  };
}

type Modelo = 'membro' | 'lideranca' | 'evento' | 'aviso' | 'liturgia' | 'pregacao' | 'canalOficial' | 'eventoFinanceiro' | 'inscricao';

interface IndicadorDef {
  chave: string;
  grupo: 'pessoas' | 'eventos' | 'financeiro' | 'conteudo';
  titulo: string;
  formula: string;
  origem: string;
  modelo: Modelo;
  tipo: 'contagem' | 'soma';
  campoSoma?: string;
  filtroBase?: Record<string, unknown>;
  campoData: string;
  /** Indicadores de "estoque" (não dependem de período) não têm variação. */
  semPeriodo?: boolean;
}

const INDICADORES: IndicadorDef[] = [
  // ---- Pessoas
  {
    chave: 'membrosAtivos',
    grupo: 'pessoas',
    titulo: 'Membros ativos',
    formula: 'COUNT(Membro WHERE status = ATIVO)',
    origem: 'Membro.status',
    modelo: 'membro',
    tipo: 'contagem',
    campoData: 'dataEntrada',
    filtroBase: { status: 'ATIVO' },
  },
  {
    chave: 'novosMembros',
    grupo: 'pessoas',
    titulo: 'Novos membros no período',
    formula: 'COUNT(Membro WHERE dataEntrada no período)',
    origem: 'Membro.dataEntrada',
    modelo: 'membro',
    tipo: 'contagem',
    campoData: 'dataEntrada',
  },
  {
    chave: 'lideresAtivos',
    grupo: 'pessoas',
    titulo: 'Líderes ativos',
    formula: 'COUNT(Liderança WHERE ativo = true)',
    origem: 'Liderança.ativo',
    modelo: 'lideranca',
    tipo: 'contagem',
    campoData: 'createdAt',
    filtroBase: { ativo: true },
    semPeriodo: true,
  },
  // ---- Eventos
  {
    chave: 'eventosRealizados',
    grupo: 'eventos',
    titulo: 'Eventos realizados',
    formula: 'COUNT(Evento WHERE status = CONCLUIDO E dataEvento no período)',
    origem: 'Evento.status + Evento.dataEvento',
    modelo: 'evento',
    tipo: 'contagem',
    campoData: 'dataEvento',
    filtroBase: { status: 'CONCLUIDO' },
  },
  {
    chave: 'eventosFuturos',
    grupo: 'eventos',
    titulo: 'Eventos futuros',
    formula: 'COUNT(Evento WHERE status = PLANEJADO E dataEvento >= hoje)',
    origem: 'Evento.status + Evento.dataEvento',
    modelo: 'evento',
    tipo: 'contagem',
    campoData: 'dataEvento',
    filtroBase: { status: 'PLANEJADO' },
    semPeriodo: true,
  },
  {
    chave: 'eventosCancelados',
    grupo: 'eventos',
    titulo: 'Eventos cancelados',
    formula: 'COUNT(Evento WHERE status = CANCELADO E dataEvento no período)',
    origem: 'Evento.status + Evento.dataEvento',
    modelo: 'evento',
    tipo: 'contagem',
    campoData: 'dataEvento',
    filtroBase: { status: 'CANCELADO' },
  },
  {
    chave: 'inscrições',
    grupo: 'eventos',
    titulo: 'Inscrições no período',
    formula: 'COUNT(Inscrição WHERE createdAt no período)',
    origem: 'Inscrição.createdAt',
    modelo: 'inscricao',
    tipo: 'contagem',
    campoData: 'createdAt',
  },
  {
    chave: 'checkIns',
    grupo: 'eventos',
    titulo: 'Check-ins realizados',
    formula: 'COUNT(Inscrição WHERE checkIn = true E dataCheckIn no período)',
    origem: 'Inscrição.checkIn + Inscrição.dataCheckIn',
    modelo: 'inscricao',
    tipo: 'contagem',
    campoData: 'dataCheckIn',
    filtroBase: { checkIn: true },
  },
  // ---- Financeiro
  {
    chave: 'receitas',
    grupo: 'financeiro',
    titulo: 'Receitas',
    formula: 'SUM(EventoFinanceiro.valor WHERE generoMovimentacao = ENTRADA E quando no período)',
    origem: 'EventoFinanceiro.generoMovimentacao + .quando',
    modelo: 'eventoFinanceiro',
    tipo: 'soma',
    campoSoma: 'valor',
    campoData: 'quando',
    filtroBase: { generoMovimentacao: 'ENTRADA' },
  },
  {
    chave: 'despesas',
    grupo: 'financeiro',
    titulo: 'Despesas',
    formula: 'SUM(EventoFinanceiro.valor WHERE generoMovimentacao = SAIDA E quando no período)',
    origem: 'EventoFinanceiro.generoMovimentacao + .quando',
    modelo: 'eventoFinanceiro',
    tipo: 'soma',
    campoSoma: 'valor',
    campoData: 'quando',
    filtroBase: { generoMovimentacao: 'SAIDA' },
  },
  {
    chave: 'dízimos',
    grupo: 'financeiro',
    titulo: 'Dízimos',
    formula: 'SUM(EventoFinanceiro.valor WHERE categoria = DIZIMO E quando no período)',
    origem: 'EventoFinanceiro.categoria + .quando',
    modelo: 'eventoFinanceiro',
    tipo: 'soma',
    campoSoma: 'valor',
    campoData: 'quando',
    filtroBase: { categoria: 'DIZIMO', generoMovimentacao: 'ENTRADA' },
  },
  {
    chave: 'ofertas',
    grupo: 'financeiro',
    titulo: 'Ofertas',
    formula: 'SUM(EventoFinanceiro.valor WHERE categoria = OFERTA E quando no período)',
    origem: 'EventoFinanceiro.categoria + .quando',
    modelo: 'eventoFinanceiro',
    tipo: 'soma',
    campoSoma: 'valor',
    campoData: 'quando',
    filtroBase: { categoria: 'OFERTA', generoMovimentacao: 'ENTRADA' },
  },
  {
    chave: 'doacoes',
    grupo: 'financeiro',
    titulo: 'Doações',
    formula: 'SUM(EventoFinanceiro.valor WHERE categoria = DOACAO E quando no período)',
    origem: 'EventoFinanceiro.categoria + .quando',
    modelo: 'eventoFinanceiro',
    tipo: 'soma',
    campoSoma: 'valor',
    campoData: 'quando',
    filtroBase: { categoria: 'DOACAO', generoMovimentacao: 'ENTRADA' },
  },
  {
    chave: 'valorPagoInscricoes',
    grupo: 'financeiro',
    titulo: 'Recebido em inscrições',
    formula: 'SUM(Inscrição.valorPago WHERE dataCheckIn/createdAt no período)',
    origem: 'Inscrição.valorPago',
    modelo: 'inscricao',
    tipo: 'soma',
    campoSoma: 'valorPago',
    campoData: 'createdAt',
  },
  // ---- Conteúdo
  {
    chave: 'liturgiasRealizadas',
    grupo: 'conteudo',
    titulo: 'Liturgias realizadas',
    formula: 'COUNT(Liturgia WHERE status = REALIZADA E data no período)',
    origem: 'Liturgia.status + Liturgia.data',
    modelo: 'liturgia',
    tipo: 'contagem',
    campoData: 'data',
    filtroBase: { status: 'REALIZADA' },
  },
  {
    chave: 'pregacoesPublicadas',
    grupo: 'conteudo',
    titulo: 'Pregações publicadas',
    formula: 'COUNT(Pregação WHERE status = PUBLICADA E data no período)',
    origem: 'Pregação.status + Pregação.data',
    modelo: 'pregacao',
    tipo: 'contagem',
    campoData: 'data',
    filtroBase: { status: 'PUBLICADA' },
  },
  {
    chave: 'canaisAtivos',
    grupo: 'conteudo',
    titulo: 'Canais oficiais ativos',
    formula: 'COUNT(CanalOficial WHERE ativo = true)',
    origem: 'CanalOficial.ativo',
    modelo: 'canalOficial',
    tipo: 'contagem',
    campoData: 'createdAt',
    filtroBase: { ativo: true },
    semPeriodo: true,
  },
  {
    chave: 'avisosAtivos',
    grupo: 'conteudo',
    titulo: 'Avisos ativos',
    formula: 'COUNT(Aviso WHERE situacaoAviso = ATIVO)',
    origem: 'Aviso.situacaoAviso',
    modelo: 'aviso',
    tipo: 'contagem',
    campoData: 'createdAt',
    filtroBase: { situacaoAviso: 'ATIVO' },
    semPeriodo: true,
  },
];

function montarWhere(
  def: IndicadorDef,
  filtros: FiltrosIndicador,
  janela: Janela | null,
  ignorarFiltroStatus = false
): Record<string, unknown> {
  const where: Record<string, unknown> = { ...(def.filtroBase || {}) };

  if (filtros.organizacaoIds.length > 0) {
    where.organizacaoId = { in: filtros.organizacaoIds };
  }
  if (filtros.congregacaoId) where.congregacaoId = filtros.congregacaoId;
  if (filtros.eventoId) where.eventoId = filtros.eventoId;
  if (filtros.categoria && !where.categoria) where.categoria = filtros.categoria;
  if (filtros.status && !ignorarFiltroStatus && !def.filtroBase?.status) {
    where.status = filtros.status;
  }
  if (janela) {
    where[def.campoData] = { gte: janela.inicio, lte: janela.fim };
  }
  return where;
}

async function calcularValor(
  def: IndicadorDef,
  filtros: FiltrosIndicador,
  janela: Janela | null
): Promise<number> {
  const where = montarWhere(def, filtros, janela);
  const campo = def.campoSoma || 'valor';

  if (def.tipo === 'soma') {
    const modelo = prisma[def.modelo] as unknown as {
      aggregate: (a: {
        where: Record<string, unknown>;
        _sum: Record<string, boolean>;
      }) => Promise<{ _sum: Record<string, number | null> }>;
    };
    const r = await modelo.aggregate({ where, _sum: { [campo]: true } });
    return Number(r._sum[campo] ?? 0);
  }

  const modelo = prisma[def.modelo] as unknown as {
    count: (a: { where: Record<string, unknown> }) => Promise<number>;
  };
  return modelo.count({ where });
}

/** Média dos últimos 6 meses (janelas mensais terminando no fim do período atual). */
async function media6Meses(def: IndicadorDef, filtros: FiltrosIndicador, fim: Date): Promise<number | null> {
  if (def.semPeriodo) return null;
  const meses: number[] = [];
  for (let i = 0; i < 6; i++) {
    const inicio = new Date(fim.getFullYear(), fim.getMonth() - i, 1);
    const fimMes = new Date(fim.getFullYear(), fim.getMonth() - i + 1, 0, 23, 59, 59, 999);
    const limiteFim = fimMes > fim ? fim : fimMes;
    meses.push(await calcularValor(def, filtros, { inicio, fim: limiteFim }));
  }
  return meses.reduce((a, b) => a + b, 0) / meses.length;
}

export interface IndicadorCalculado {
  chave: string;
  grupo: string;
  titulo: string;
  valor: number;
  periodoAnterior: number | null;
  variacaoPercentual: number | null;
  media6Meses: number | null;
  formula: string;
  origem: string;
  unidade: 'unidade' | 'moeda';
  filtrosAplicados: Record<string, unknown>;
}

function variacao(atual: number, anterior: number | null): number | null {
  if (anterior === null || anterior === 0) return null;
  return Number((((atual - anterior) / anterior) * 100).toFixed(2));
}

/**
 * Calcula todos os indicadores para o período/filtros informados.
 */
export async function calcularIndicadores(
  periodo: Periodo,
  filtros: FiltrosIndicador
): Promise<IndicadorCalculado[]> {
  const resultados = await Promise.all(
    INDICADORES.map(async (def): Promise<IndicadorCalculado> => {
      const valor = await calcularValor(def, filtros, def.semPeriodo ? null : periodo.atual);
      const anterior = def.semPeriodo
        ? null
        : await calcularValor(def, filtros, periodo.anterior);
      const media = await media6Meses(def, filtros, periodo.atual.fim);

      return {
        chave: def.chave,
        grupo: def.grupo,
        titulo: def.titulo,
        valor,
        periodoAnterior: anterior,
        variacaoPercentual: def.semPeriodo ? null : variacao(valor, anterior),
        media6Meses: media === null ? null : Number(media.toFixed(2)),
        formula: def.formula,
        origem: def.origem,
        unidade: def.tipo === 'soma' ? 'moeda' : 'unidade',
        filtrosAplicados: {
          periodo: periodo.label,
          inicio: periodo.atual.inicio.toISOString(),
          fim: periodo.atual.fim.toISOString(),
          organizacaoIds: filtros.organizacaoIds,
          congregacaoId: filtros.congregacaoId || null,
          eventoId: filtros.eventoId || null,
          categoria: filtros.categoria || null,
          status: filtros.status || null,
        },
      };
    })
  );

  return resultados;
}

/**
 * Indicadores legados do `GET /api/dashboard` (mantidos para não quebrar o painel atual).
 * Delegam ao core para não haver duas fontes de verdade.
 */
export async function indicadoresDashboardLegado(filtros: FiltrosIndicador) {
  const periodo = resolvePeriodo('ano');
  const lista = await calcularIndicadores(periodo, filtros);
  const porChave = Object.fromEntries(lista.map(i => [i.chave, i.valor]));
  return {
    totalMembros: porChave.membrosAtivos ?? 0,
    totalLideres: porChave.lideresAtivos ?? 0,
    eventosRealizados: porChave.eventosRealizados ?? 0,
    eventosFuturos: porChave.eventosFuturos ?? 0,
    avisosAtivos: porChave.avisosAtivos ?? 0,
  };
}

/**
 * Indicadores legados do `GET /api/comunicacao/dashboard`.
 */
export async function indicadoresComunicacaoLegado(filtros: FiltrosIndicador) {
  const where: Record<string, unknown> = {};
  if (filtros.organizacaoIds.length > 0) {
    where.organizacaoId = { in: filtros.organizacaoIds };
  }

  const [totalPregacoes, publicadas, rascunhos, arquivadas, canaisAtivos, ultimaPregacao] =
    await Promise.all([
      prisma.pregacao.count({ where }),
      prisma.pregacao.count({ where: { ...where, status: 'PUBLICADA' } }),
      prisma.pregacao.count({ where: { ...where, status: 'RASCUNHO' } }),
      prisma.pregacao.count({ where: { ...where, status: 'ARQUIVADA' } }),
      prisma.canalOficial.count({ where: { ...where, ativo: true } }),
      prisma.pregacao.findFirst({
        where: { ...where, status: 'PUBLICADA' },
        orderBy: { data: 'desc' },
        select: { id: true, titulo: true, data: true, pregadorNome: true, slug: true },
      }),
    ]);

  return {
    totalPregacoes,
    publicadas,
    rascunhos,
    arquivadas,
    canaisAtivos,
    ultimaPregacao,
  };
}

export { INDICADORES };
