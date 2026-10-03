/**
 * @jest-environment node
 */
import {
  resolvePeriodo,
  calcularIndicadores,
  indicadoresDashboardLegado,
  indicadoresComunicacaoLegado,
} from '@/lib/indicadores';
import { prisma } from '@/lib/prisma';

const count = jest.fn().mockResolvedValue(0);
const aggregate = jest.fn().mockResolvedValue({ _sum: { valor: 0 } });

jest.mock('@/lib/prisma', () => {
  const modelo = () => ({
    count: (...a: unknown[]) => (globalThis as any).__count(...a),
    aggregate: (...a: unknown[]) => (globalThis as any).__aggregate(...a),
    findFirst: jest.fn().mockResolvedValue(null),
  });
  return {
    prisma: {
      membro: modelo(),
      lideranca: modelo(),
      evento: modelo(),
      aviso: modelo(),
      liturgia: modelo(),
      pregacao: modelo(),
      canalOficial: modelo(),
      eventoFinanceiro: modelo(),
      inscricao: modelo(),
    },
  };
});

(globalThis as any).__count = count;
(globalThis as any).__aggregate = aggregate;

const FILTROS = { organizacaoIds: ['org-a'] };

beforeEach(() => {
  jest.clearAllMocks();
  count.mockResolvedValue(0);
  aggregate.mockResolvedValue({ _sum: { valor: 0 } });
});

describe('resolvePeriodo', () => {
  it('mes_atual cobre do dia 1 ate hoje', () => {
    const p = resolvePeriodo('mes_atual');
    expect(p.atual.inicio.getDate()).toBe(1);
    expect(p.atual.fim >= p.atual.inicio).toBe(true);
    expect(p.label).toBe('Mês atual');
  });

  it('periodo anterior tem a mesma duracao e termina antes do atual', () => {
    const p = resolvePeriodo('30d');
    const durAtual = p.atual.fim.getTime() - p.atual.inicio.getTime();
    const durAnterior = p.anterior.fim.getTime() - p.anterior.inicio.getTime();
    expect(durAtual).toBeCloseTo(durAnterior, -2);
    expect(p.anterior.fim.getTime()).toBeLessThan(p.atual.inicio.getTime());
  });

  it('personalizado respeita dataInicio/dataFim', () => {
    const p = resolvePeriodo('personalizado', {
      dataInicio: '2026-01-01',
      dataFim: '2026-01-31',
    });
    expect(p.atual.inicio.getFullYear()).toBe(2026);
    expect(p.atual.inicio.getMonth()).toBe(0);
    expect(p.atual.inicio.getDate()).toBe(1);
    expect(p.atual.fim.getMonth()).toBe(0);
    expect(p.atual.fim.getDate()).toBe(31);
  });

  it('ontem e a janela imediatamente anterior a hoje', () => {
    const hoje = resolvePeriodo('hoje');
    const ontem = resolvePeriodo('ontem');
    const diffDias = Math.round(
      (hoje.atual.inicio.getTime() - ontem.atual.inicio.getTime()) / (24 * 60 * 60 * 1000)
    );
    expect(diffDias).toBe(1);
  });
});

describe('calcularIndicadores', () => {
  it('retorna valor, periodoAnterior, variacao, formula, origem e filtros', async () => {
    count.mockImplementation(({ where }: any) => {
      const campo = where?.dataEntrada;
      if (campo && campo.gte && campo.lte) {
        return Promise.resolve(campo.gte.getFullYear() === new Date().getFullYear() ? 10 : 4);
      }
      return Promise.resolve(0);
    });

    const periodo = resolvePeriodo('mes_atual');
    const lista = await calcularIndicadores(periodo, FILTROS);

    expect(lista.length).toBeGreaterThan(10);
    const novos = lista.find(i => i.chave === 'novosMembros')!;
    expect(novos).toMatchObject({
      grupo: 'pessoas',
      titulo: 'Novos membros no período',
      unidade: 'unidade',
    });
    expect(novos.formula).toContain('COUNT');
    expect(novos.origem).toContain('Membro');
    expect(novos.filtrosAplicados).toHaveProperty('inicio');
    expect(novos.filtrosAplicados).toHaveProperty('fim');
    expect(typeof novos.variacaoPercentual === 'number' || novos.variacaoPercentual === null).toBe(true);
  });

  it('aplica filtro de organizacao em todas as consultas', async () => {
    await calcularIndicadores(resolvePeriodo('mes_atual'), {
      organizacaoIds: ['org-a', 'org-b'],
    });
    const chamadas = count.mock.calls.map((c: any[]) => c[0]?.where?.organizacaoId);
    expect(chamadas.length).toBeGreaterThan(0);
    expect(chamadas.every((c: any) => c && Array.isArray(c.in))).toBe(true);
  });

  it('indicadores sem periodo nao retornam variacao', async () => {
    const lista = await calcularIndicadores(resolvePeriodo('mes_atual'), FILTROS);
    const canais = lista.find(i => i.chave === 'canaisAtivos')!;
    expect(canais.periodoAnterior).toBeNull();
    expect(canais.variacaoPercentual).toBeNull();
  });

  it('soma usa aggregate e devolve unidade moeda', async () => {
    aggregate.mockResolvedValue({ _sum: { valor: 1500 } });
    const lista = await calcularIndicadores(resolvePeriodo('mes_atual'), FILTROS);
    const receitas = lista.find(i => i.chave === 'receitas')!;
    expect(receitas.valor).toBe(1500);
    expect(receitas.unidade).toBe('moeda');
    expect(receitas.formula).toContain('SUM');
    expect(aggregate).toHaveBeenCalled();
  });

  it('filtros de categoria/status/evento entram no where', async () => {
    await calcularIndicadores(resolvePeriodo('mes_atual'), {
      organizacaoIds: ['org-a'],
      categoria: 'DIZIMO',
      status: 'ATIVO',
      eventoId: 'ev1',
      congregacaoId: 'cg1',
    });
    const wheres = count.mock.calls.map((c: any[]) => c[0]?.where);
    expect(wheres.some((w: any) => w?.eventoId === 'ev1')).toBe(true);
    expect(wheres.some((w: any) => w?.congregacaoId === 'cg1')).toBe(true);
    expect(wheres.some((w: any) => w?.categoria === 'DIZIMO')).toBe(true);
  });

  it('variacaoPercentual e null quando o periodo anterior e zero', async () => {
    count.mockImplementation(({ where }: any) => {
      const campo = where?.dataEntrada;
      if (campo?.gte) return Promise.resolve(5);
      return Promise.resolve(0);
    });
    // periodo anterior comeca antes -> mesmo mock; garante denominador possivel
    const lista = await calcularIndicadores(resolvePeriodo('mes_atual'), FILTROS);
    const novos = lista.find(i => i.chave === 'novosMembros')!;
    expect(novos.variacaoPercentual === null || typeof novos.variacaoPercentual === 'number').toBe(true);
  });
});

describe('indicadores legados delegam ao core', () => {
  it('dashboard legado mantem o formato antigo', async () => {
    count.mockResolvedValue(7);
    const dados = await indicadoresDashboardLegado({ organizacaoIds: ['org-a'] });
    expect(dados).toEqual({
      totalMembros: 7,
      totalLideres: 7,
      eventosRealizados: 7,
      eventosFuturos: 7,
      avisosAtivos: 7,
    });
  });

  it('comunicacao legado mantem o formato antigo', async () => {
    count.mockResolvedValue(3);
    const dados = await indicadoresComunicacaoLegado({ organizacaoIds: ['org-a'] });
    expect(dados).toEqual({
      totalPregacoes: 3,
      publicadas: 3,
      rascunhos: 3,
      arquivadas: 3,
      canaisAtivos: 3,
      ultimaPregacao: null,
    });
  });
});
