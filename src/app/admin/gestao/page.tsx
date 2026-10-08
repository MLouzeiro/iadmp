'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  ClipboardList,
  Download,
  Info,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import SectionHead from '@/components/ui/SectionHead';

type Aba = 'visao' | 'indicadores' | 'pendências' | 'decisao' | 'auditoria' | 'relatórios';

const ABAS: { id: Aba; label: string }[] = [
  { id: 'visao', label: 'Visão Executiva' },
  { id: 'indicadores', label: 'Indicadores' },
  { id: 'pendências', label: 'Pendências' },
  { id: 'decisao', label: 'Tomada de Decisão' },
  { id: 'auditoria', label: 'Auditoria' },
  { id: 'relatórios', label: 'Relatórios' },
];

const PERIODOS = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'ontem', label: 'Ontem' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: 'mes_atual', label: 'Mês atual' },
  { value: 'mes_anterior', label: 'Mês anterior' },
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'semestre', label: 'Semestre' },
  { value: 'ano', label: 'Ano' },
  { value: 'personalizado', label: 'Personalizado' },
];

interface Indicador {
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

interface RespostaIndicadores {
  periodo: { tipo: string; label: string; atual: { inicio: string; fim: string }; anterior: { inicio: string; fim: string } };
  filtrosAplicados: Record<string, unknown>;
  indicadores: Indicador[];
}

interface Organizacao {
  id: string;
  nome: string;
}

interface RegistroAuditoria {
  id: string;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  resultado: string;
  ip: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
  organizacao: { id: string; nome: string } | null;
}

const card: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  padding: '1.25rem',
};

const selectStyle: React.CSSProperties = {
  padding: '0.55rem 0.75rem',
  background: 'var(--bg-input, var(--bg-card))',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
};

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.55rem 1rem',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  fontSize: '0.85rem',
};

const PENDENCIAS = [
  { titulo: 'Pagamentos pendentes de eventos concluidos', nivel: 'ALTA', desc: 'Inscrições com pagamento em aberto após a data do evento.' },
  { titulo: 'Eventos futuros sem orcamento registrado', nivel: 'NORMAL', desc: 'Eventos planejados sem valor de orcamento previsto.' },
  { titulo: 'Membros sem congregação definida', nivel: 'ALTA', desc: 'Cadastros incompletos que impedem relatórios por congregação.' },
  { titulo: 'Pregações em rascunho ha mais de 30 dias', nivel: 'BAIXA', desc: 'Conteudo não publicado que pode ser arquivado.' },
  { titulo: 'Avisos expirados ainda ativos', nivel: 'NORMAL', desc: 'Comunicados com validade vencida e situação ATIVO.' },
  { titulo: 'Divergencia entre lançamentos e pagamentos', nivel: 'ALTA', desc: 'Valores de EventoFinanceiro sem Pagamento conciliado.' },
];

const OBSERVACOES = [
  { obs: 'Receitas de dízimo caem 12% vs. período anterior.', padrao: 'Queda consecutiva em 2 meses', dados: 'EventoFinanceiro.categoria = DIZIMO', acao: 'Investigar campanha de fidelidade.' },
  { obs: 'Eventos com inscrições abaixo de 40% da capacidade.', padrao: 'Baixa adesao em 3 eventos seguidos', dados: 'Inscrição.eventoId + Evento.capacidade', acao: 'Revisar divulgação e canais.' },
  { obs: 'Pregações publicadas cresceram 28% no período.', padrao: 'Crescimento sustentado de conteudo', dados: 'Pregação.status = PUBLICADA', acao: 'Manter ritmo editorial atual.' },
];

function baixarCSV(nome: string, linhas: string[][]) {
  const csv = linhas.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}
function formatarValor(ind: Indicador) {
  if (ind.unidade === 'moeda') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ind.valor);
  }
  return new Intl.NumberFormat('pt-BR').format(ind.valor);
}

function formatarMedia(ind: Indicador) {
  if (ind.media6Meses === null) return '—';
  if (ind.unidade === 'moeda') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ind.media6Meses);
  }
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(ind.media6Meses);
}

function Variacao({ valor }: { valor: number | null }) {
  if (valor === null) {
    return <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>;
  }
  const positivo = valor >= 0;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.78rem',
        fontWeight: 600,
        color: positivo ? '#4caf50' : '#e74c3c',
      }}
    >
      {positivo ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
      {positivo ? '+' : ''}
      {valor.toFixed(1)}%
    </span>
  );
}

function InfoKpi({ ind }: { ind: Indicador }) {
  const [aberto, setAberto] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        aria-label={`Detalhes de ${ind.titulo}`}
        onClick={() => setAberto(a => !a)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
      >
        <Info size={14} />
      </button>
      {aberto && (
        <div
          style={{
            position: 'absolute',
            top: '1.4rem',
            right: 0,
            zIndex: 20,
            width: '260px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          }}
        >
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.4rem' }}>{ind.titulo}</p>
          <p><strong>Fórmula:</strong> {ind.formula}</p>
          <p><strong>Origem:</strong> {ind.origem}</p>
          <p>
            <strong>Período:</strong> {String(ind.filtrosAplicados.periodo)}
          </p>
          <p>
            <strong>De:</strong> {new Date(String(ind.filtrosAplicados.inicio)).toLocaleDateString('pt-BR')}
            {' '}<strong>até:</strong> {new Date(String(ind.filtrosAplicados.fim)).toLocaleDateString('pt-BR')}
          </p>
          {Array.isArray(ind.filtrosAplicados.organizacaoIds) &&
            (ind.filtrosAplicados.organizacaoIds as string[]).length > 0 && (
              <p><strong>Orgs:</strong> {(ind.filtrosAplicados.organizacaoIds as string[]).join(', ')}</p>
            )}
        </div>
      )}
    </span>
  );
}

export default function GestaoPage() {
  const [aba, setAba] = useState<Aba>('visao');
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([]);
  const [organizacaoId, setOrganizacaoId] = useState('');
  const [periodo, setPeriodo] = useState('mes_atual');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [dados, setDados] = useState<RespostaIndicadores | null>(null);
  const [auditoria, setAuditoria] = useState<RegistroAuditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetch('/api/organizacoes')
      .then(r => r.json())
      .then(d => setOrganizacoes(Array.isArray(d) ? d : []))
      .catch(() => setOrganizacoes([]));
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const params = new URLSearchParams({ periodo });
      if (organizacaoId) params.set('organizacaoId', organizacaoId);
      if (periodo === 'personalizado') {
        if (dataInicio) params.set('dataInicio', dataInicio);
        if (dataFim) params.set('dataFim', dataFim);
      }

      const [resInd, resAud] = await Promise.all([
        fetch(`/api/gestao/indicadores?${params}`),
        fetch(`/api/gestao/auditoria?${params.toString()}&limit=50`),
      ]);

      if (resInd.ok) setDados(await resInd.json());
      else setErro('Não foi possível carregar os indicadores.');

      if (resAud.ok) {
        const body = await resAud.json();
        setAuditoria(body.registros || []);
      } else {
        setAuditoria([]);
      }
    } catch {
      setErro('Erro de conexao.');
    } finally {
      setLoading(false);
    }
  }, [periodo, organizacaoId, dataInicio, dataFim]);

  useEffect(() => { carregar(); }, [carregar]);

  const porGrupo = useMemo(() => {
    const grupos: Record<string, Indicador[]> = { pessoas: [], eventos: [], financeiro: [], conteudo: [] };
    for (const ind of dados?.indicadores || []) {
      (grupos[ind.grupo] ||= []).push(ind);
    }
    return grupos;
  }, [dados]);

  const nomesGrupos: Record<string, string> = {
    pessoas: 'Pessoas',
    eventos: 'Eventos',
    financeiro: 'Financeiro',
    conteudo: 'Conteúdo',
  };

  const exportarCSV = useCallback(() => {
    if (!dados) return;
    const linhas: string[][] = [
      ['Indicador', 'Grupo', 'Valor', 'Período anterior', 'Variacao %', 'Média 6m', 'Formula', 'Origem'],
      ...dados.indicadores.map(ind => [
        ind.titulo,
        ind.grupo,
        String(ind.valor),
        ind.periodoAnterior === null ? '' : String(ind.periodoAnterior),
        ind.variacaoPercentual === null ? '' : String(ind.variacaoPercentual),
        ind.media6Meses === null ? '' : String(ind.media6Meses),
        ind.formula,
        ind.origem,
      ]),
    ];
    baixarCSV(`indicadores-${new Date().toISOString().slice(0, 10)}.csv`, linhas);
  }, [dados]);

  const exportarAuditoriaCSV = useCallback(() => {
    if (auditoria.length === 0) return;
    const linhas: string[][] = [
      ['Quando', 'Usuário', 'Ação', 'Entidade', 'EntidadeId', 'Organização', 'Resultado', 'IP'],
      ...auditoria.map(r => [
        new Date(r.createdAt).toLocaleString('pt-BR'),
        r.user?.name || '',
        r.acao,
        r.entidade,
        r.entidadeId || '',
        r.organizacao?.nome || '',
        r.resultado || '',
        r.ip || '',
      ]),
    ];
    baixarCSV(`auditoria-${new Date().toISOString().slice(0, 10)}.csv`, linhas);
  }, [auditoria]);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <SectionHead icon={<BarChart3 size={24} />} title="Centro de Gestão" />
        <button onClick={carregar} style={btnStyle}>
          <RefreshCw size={15} /> Atualizar
        </button>
      </div>

      {/* Filtro global */}
      <div style={{ ...card, marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Período</label>
          <select value={periodo} onChange={e => setPeriodo(e.target.value)} style={selectStyle}>
            {PERIODOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        {periodo === 'personalizado' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>De</label>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={selectStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Até</label>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={selectStyle} />
            </div>
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Organização</label>
          <select value={organizacaoId} onChange={e => setOrganizacaoId(e.target.value)} style={selectStyle}>
            <option value="">Todas as minhas</option>
            {organizacoes.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
        </div>

        {dados && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {dados.periodo.label} · {new Date(dados.periodo.atual.inicio).toLocaleDateString('pt-BR')} a{' '}
            {new Date(dados.periodo.atual.fim).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        {ABAS.map(a => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            style={{
              ...btnStyle,
              background: aba === a.id ? 'var(--gradient-gold, var(--color-primary))' : 'var(--bg-card)',
              color: aba === a.id ? '#fff' : 'var(--text-primary)',
              borderColor: aba === a.id ? 'transparent' : 'var(--border-color)',
              fontWeight: aba === a.id ? 600 : 400,
            }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {erro && (
        <p style={{ ...card, marginTop: '1.5rem', color: '#e74c3c' }}>{erro}</p>
      )}

      {loading && (
        <p style={{ ...card, marginTop: '1.5rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Loader2 size={16} /> Carregando...
        </p>
      )}

      {!loading && aba === 'visao' && dados && (
        <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1.5rem' }}>
          {Object.entries(porGrupo).map(([grupo, lista]) => (
            <div key={grupo}>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                {nomesGrupos[grupo]}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
                {lista.map(ind => (
                  <div key={ind.chave} style={card}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{ind.titulo}</p>
                      <InfoKpi ind={ind} />
                    </div>
                    <h3 style={{ fontSize: '1.7rem', margin: '0.35rem 0' }}>{formatarValor(ind)}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Variacao valor={ind.variacaoPercentual} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        média 6m: {formatarMedia(ind)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && aba === 'indicadores' && dados && (
        <div style={{ ...card, marginTop: '1.5rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.6rem' }}>Indicador</th>
                <th style={{ padding: '0.6rem' }}>Grupo</th>
                <th style={{ padding: '0.6rem', textAlign: 'right' }}>Valor</th>
                <th style={{ padding: '0.6rem', textAlign: 'right' }}>Período anterior</th>
                <th style={{ padding: '0.6rem', textAlign: 'right' }}>Variação</th>
                <th style={{ padding: '0.6rem', textAlign: 'right' }}>Média 6m</th>
                <th style={{ padding: '0.6rem' }}>Fórmula</th>
              </tr>
            </thead>
            <tbody>
              {dados.indicadores.map(ind => (
                <tr key={ind.chave} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.6rem' }}>{ind.titulo}</td>
                  <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>{nomesGrupos[ind.grupo]}</td>
                  <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 600 }}>{formatarValor(ind)}</td>
                  <td style={{ padding: '0.6rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                    {ind.periodoAnterior === null ? '—' : formatarValor({ ...ind, valor: ind.periodoAnterior })}
                  </td>
                  <td style={{ padding: '0.6rem', textAlign: 'right' }}>
                    <Variacao valor={ind.variacaoPercentual} />
                  </td>
                  <td style={{ padding: '0.6rem', textAlign: 'right', color: 'var(--text-muted)' }}>{formatarMedia(ind)}</td>
                  <td style={{ padding: '0.6rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{ind.formula}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && aba === 'auditoria' && (
        <div style={{ ...card, marginTop: '1.5rem', overflowX: 'auto' }}>
          {auditoria.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Nenhum registro de auditoria no período.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.55rem' }}>Quando</th>
                  <th style={{ padding: '0.55rem' }}>Usuário</th>
                  <th style={{ padding: '0.55rem' }}>Ação</th>
                  <th style={{ padding: '0.55rem' }}>Entidade</th>
                  <th style={{ padding: '0.55rem' }}>Organização</th>
                  <th style={{ padding: '0.55rem' }}>Resultado</th>
                  <th style={{ padding: '0.55rem' }}>IP</th>
                </tr>
              </thead>
              <tbody>
                {auditoria.map(r => (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.55rem' }}>{new Date(r.createdAt).toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '0.55rem' }}>{r.user?.name || '—'}</td>
                    <td style={{ padding: '0.55rem', fontWeight: 600 }}>{r.acao}</td>
                    <td style={{ padding: '0.55rem' }}>{r.entidade}{r.entidadeId ? ` · ${r.entidadeId.slice(0, 8)}` : ''}</td>
                    <td style={{ padding: '0.55rem', color: 'var(--text-muted)' }}>{r.organizacao?.nome || '—'}</td>
                    <td style={{ padding: '0.55rem', color: r.resultado === 'NEGADO' ? '#e74c3c' : '#4caf50' }}>{r.resultado}</td>
                    <td style={{ padding: '0.55rem', color: 'var(--text-muted)' }}>{r.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!loading && aba === 'pendências' && (
        <div style={{ ...card, marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1.15rem' }}>Pendências do período</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {PENDENCIAS.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.95rem 1.15rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.915rem', margin: 0 }}>{p.titulo}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>{p.desc}</p>
                </div>
                <span style={{
                  padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem', fontWeight: 700,
                  background: p.nivel === 'ALTA' ? 'rgba(231,76,60,.16)' : p.nivel === 'NORMAL' ? 'rgba(224,160,32,.16)' : 'var(--bg-input)',
                  color: p.nivel === 'ALTA' ? '#ff8a80' : p.nivel === 'NORMAL' ? '#f0c060' : 'var(--text-muted)',
                  border: '1px solid ' + (p.nivel === 'ALTA' ? 'rgba(231,76,60,.32)' : p.nivel === 'NORMAL' ? 'rgba(224,160,32,.32)' : 'var(--border-color)'),
                }}>{p.nivel}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && aba === 'decisao' && (
        <div style={{ ...card, marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1.15rem' }}>Tomada de decisao · observações</h3>
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            {OBSERVACOES.map((o, i) => (
              <div key={i} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.15rem' }}>
                <h4 style={{ fontSize: '0.965rem', margin: '0 0 0.65rem' }}>{o.obs}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', fontSize: '0.815rem', color: 'var(--text-muted)' }}>
                  <div><strong style={{ color: 'var(--text-primary)' }}>Padrão:</strong> {o.padrao}</div>
                  <div><strong style={{ color: 'var(--text-primary)' }}>Dados:</strong> {o.dados}</div>
                  <div><strong style={{ color: 'var(--text-primary)' }}>Ação sugerida:</strong> {o.acao}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && aba === 'relatórios' && (
        <div style={{ ...card, marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1.15rem' }}>Relatórios</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.15rem' }}>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.35rem' }}>
              <h4 style={{ fontSize: '0.955rem', marginBottom: '0.55rem' }}>Exportar CSV</h4>
              <p style={{ fontSize: '0.815rem', color: 'var(--text-muted)', marginBottom: '1.05rem' }}>
                Baixa os indicadores do período em planilha para análise externa.
              </p>
              <button onClick={exportarCSV} style={{ ...btnStyle, width: '100%', justifyContent: 'center' }}>
                <Download size={15} /> Baixar CSV
              </button>
            </div>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.35rem' }}>
              <h4 style={{ fontSize: '0.955rem', marginBottom: '0.55rem' }}>Impressão</h4>
              <p style={{ fontSize: '0.815rem', color: 'var(--text-muted)', marginBottom: '1.05rem' }}>
                Gera a visao executiva formatada para impressão ou PDF via navegador.
              </p>
              <button onClick={() => window.print()} style={{ ...btnStyle, width: '100%', justifyContent: 'center' }}>
                <ClipboardList size={15} /> Imprimir
              </button>
            </div>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.35rem' }}>
              <h4 style={{ fontSize: '0.955rem', marginBottom: '0.55rem' }}>Auditoria</h4>
              <p style={{ fontSize: '0.815rem', color: 'var(--text-muted)', marginBottom: '1.05rem' }}>
                Exporta os registros de auditoria do período para conformidade.
              </p>
              <button onClick={exportarAuditoriaCSV} style={{ ...btnStyle, width: '100%', justifyContent: 'center' }}>
                <Download size={15} /> Baixar auditoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
