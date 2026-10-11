'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download, Filter, FileText, Users, Calendar, BarChart3, ChevronDown, ChevronUp, Eye, Printer, Search, AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import styles from '@/components/ui/form.module.css';

interface IndicadorLiderDetalhado {
  liderancaId: string;
  nome: string;
  cargo: string;
  ministerio?: string | null;
  congregacao?: string | null;
  ativo: boolean;
  dataInicio: string | null;
  dataFim: string | null;
  tempoDias: number;
  tempoLabel: string;
  historico: { cargoAnterior: string | null; cargoNovo: string; dataInicio: string | null; dataFim: string | null; motivo: string | null; createdAt: string }[];
  desempenho: {
    eventosOrganizador: number;
    eventosParticipante: number;
    liturgias: number;
    pregacoes: number;
    total: number;
  };
  eventosOrganizados: { id: string; nome: string; dataEvento: string; funcao: string; principal: boolean }[];
  liturgiasParticipadas: { id: string; data: string; papel: string }[];
  pregacoes: { id: string; titulo: string; data: string }[];
}

interface IndicadoresLiderancaDetalhadaResult {
  resumo: {
    totalLideres: number;
    ativos: number;
    encerrados: number;
    tempoMedioAtivosDias: number;
    tempoMedioEncerradosDias: number;
  };
  lideres: IndicadorLiderDetalhado[];
}

type AbaRelatorio = 'lideranca' | 'eventos' | 'auditoria';

const ABAS: { id: AbaRelatorio; label: string; icon: React.ElementType }[] = [
  { id: 'lideranca', label: 'Liderança', icon: Users },
  { id: 'eventos', label: 'Eventos', icon: Calendar },
  { id: 'auditoria', label: 'Auditoria', icon: BarChart3 },
];

export default function RelatoriosClient() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [aba, setAba] = useState<AbaRelatorio>('lideranca');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IndicadoresLiderancaDetalhadaResult | null>(null);
  const [filtros, setFiltros] = useState({
    cargo: '',
    ministerioId: '',
    situacao: 'todos' as 'ativos' | 'encerrados' | 'todos',
    dataInicio: '',
    dataFim: '',
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const fetchRelatorioLideranca = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.cargo) params.set('cargo', filtros.cargo);
      if (filtros.ministerioId) params.set('ministerioId', filtros.ministerioId);
      if (filtros.situacao !== 'todos') params.set('situacao', filtros.situacao);
      if (filtros.dataInicio) params.set('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params.set('dataFim', filtros.dataFim);

      const res = await fetch(`/api/indicadores/lideranca-detalhada?${params}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        toast('Erro ao buscar relatório de liderança', 'err');
      }
    } catch (e) {
      toast('Erro de conexão', 'err');
    } finally {
      setLoading(false);
    }
  }, [filtros, toast]);

  useEffect(() => {
    if (aba === 'lideranca') fetchRelatorioLideranca();
  }, [aba, fetchRelatorioLideranca]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedLideres = data?.lideres
    ? [...data.lideres].sort((a, b) => {
        if (!sortConfig) return 0;
        const aVal = (a as any)[sortConfig.key];
        const bVal = (b as any)[sortConfig.key];
        if (aVal === undefined || bVal === undefined) return 0;
        const direction = sortConfig.direction === 'asc' ? 1 : -1;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal) * direction;
        }
        return (aVal - bVal) * direction;
      })
    : [];

  const exportarCSV = (nome: string, headers: string[], rows: (string | number)[][]) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nome}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarLiderancaCSV = () => {
    if (!data) return;
    const headers = ['Nome', 'Cargo', 'Ministério', 'Congregação', 'Situação', 'Início', 'Fim', 'Tempo (dias)', 'Tempo', 'Eventos Organizados', 'Eventos Participante', 'Liturgias', 'Pregações', 'Total'];
    const rows = sortedLideres.map(l => [
      l.nome, l.cargo, l.ministerio || '', l.congregacao || '',
      l.ativo ? 'Ativo' : 'Encerrado',
      l.dataInicio ? new Date(l.dataInicio).toLocaleDateString('pt-BR') : '',
      l.dataFim ? new Date(l.dataFim).toLocaleDateString('pt-BR') : '',
      l.tempoDias, l.tempoLabel,
      l.desempenho.eventosOrganizador, l.desempenho.eventosParticipante,
      l.desempenho.liturgias, l.desempenho.pregacoes, l.desempenho.total,
    ]);
    exportarCSV('relatorio-lideranca', headers, rows);
  };

  const exportarDetalhesLiderCSV = (lider: any) => {
    const headers = ['Tipo', 'Detalhe', 'Data', 'Função/Papel'];
    const rows: (string | number)[][] = [];

    lider.eventosOrganizados.forEach((e: any) => {
      rows.push(['Evento Organizado', e.nome, new Date(e.dataEvento).toLocaleDateString('pt-BR'), `${e.funcao}${e.principal ? ' (Principal)' : ''}`]);
    });
    lider.liturgiasParticipadas.forEach((lit: any) => {
      rows.push(['Liturgia', lit.papel, new Date(lit.data).toLocaleDateString('pt-BR'), '']);
    });
    lider.pregacoes.forEach((p: any) => {
      rows.push(['Pregação', p.titulo, new Date(p.data).toLocaleDateString('pt-BR'), '']);
    });
    lider.historico.forEach((h: any) => {
      rows.push(['Histórico Cargo', `${h.cargoAnterior || '—'} → ${h.cargoNovo}`, h.dataInicio ? new Date(h.dataInicio).toLocaleDateString('pt-BR') : '', h.motivo || '']);
    });

    exportarCSV(`detalhes-${lider.nome.replace(/\s+/g, '-')}`, headers, rows);
  };

  const imprimir = () => window.print();

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {ABAS.map(a => (
          <Button
            key={a.id}
            variant={aba === a.id ? 'default' : 'secondary'}
            icon={<a.icon size={16} />}
            onClick={() => setAba(a.id)}
          >
            {a.label}
          </Button>
        ))}
      </div>

      {aba === 'lideranca' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Cargo</label>
              <input type="text" value={filtros.cargo} onChange={e => setFiltros(p => ({ ...p, cargo: e.target.value }))} placeholder="Filtrar por cargo" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Situação</label>
              <select value={filtros.situacao} onChange={e => setFiltros(p => ({ ...p, situacao: e.target.value as any }))} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                <option value="todos">Todos</option>
                <option value="ativos">Ativos</option>
                <option value="encerrados">Encerrados</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Início</label>
              <input type="date" value={filtros.dataInicio} onChange={e => setFiltros(p => ({ ...p, dataInicio: e.target.value }))} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Fim</label>
              <input type="date" value={filtros.dataFim} onChange={e => setFiltros(p => ({ ...p, dataFim: e.target.value }))} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Líderes', valor: data?.resumo.totalLideres ?? 0 },
              { label: 'Ativos', valor: data?.resumo.ativos ?? 0 },
              { label: 'Encerrados', valor: data?.resumo.encerrados ?? 0 },
              { label: 'Tempo Médio Ativos', valor: `${data?.resumo.tempoMedioAtivosDias ?? 0} dias` },
            ].map((item, i) => (
              <div key={i} style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-primary)' }}>
                <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{item.label}</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.valor}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <div className={styles.loadingState}>Carregando relatório de liderança...</div>
          ) : data?.lideres.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Nenhum líder encontrado com os filtros atuais.</div>
          ) : (
            <>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                      {[
                        { key: 'nome', label: 'Nome' },
                        { key: 'cargo', label: 'Cargo' },
                        { key: 'ministerio', label: 'Ministério' },
                        { key: 'congregacao', label: 'Congregação' },
                        { key: 'ativo', label: 'Situação' },
                        { key: 'dataInicio', label: 'Início' },
                        { key: 'dataFim', label: 'Fim' },
                        { key: 'tempoDias', label: 'Tempo (dias)' },
                        { key: 'desempenho.eventosOrganizador', label: 'Ev. Organizador' },
                        { key: 'desempenho.eventosParticipante', label: 'Ev. Participante' },
                        { key: 'desempenho.liturgias', label: 'Liturgias' },
                        { key: 'desempenho.pregacoes', label: 'Pregações' },
                        { key: 'desempenho.total', label: 'Total' },
                      ].map(col => (
                        <th key={col.key} style={{ padding: '0.75rem', textAlign: 'left', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }} onClick={() => handleSort(col.key)}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {col.label}
                            {sortConfig?.key === col.key && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                          </span>
                        </th>
                      ))}
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLideres.map(l => (
                      <tr key={l.liderancaId} style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 500 }}>{l.nome}</td>
                        <td style={{ padding: '0.75rem' }}>{l.cargo}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{l.ministerio || '—'}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{l.congregacao || '—'}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 600, background: l.ativo ? 'rgba(76,175,80,0.15)' : 'rgba(158,158,158,0.15)', color: l.ativo ? '#81c784' : '#9e9e9e' }}>
                            {l.ativo ? 'Ativo' : 'Encerrado'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{l.dataInicio ? new Date(l.dataInicio).toLocaleDateString('pt-BR') : '—'}</td>
                        <td style={{ padding: '0.75rem' }}>{l.dataFim ? new Date(l.dataFim).toLocaleDateString('pt-BR') : '—'}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 500 }}>{l.tempoDias} ({l.tempoLabel})</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>{l.desempenho.eventosOrganizador}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{l.desempenho.eventosParticipante}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{l.desempenho.liturgias}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{l.desempenho.pregacoes}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700, color: 'var(--color-primary)' }}>{l.desempenho.total}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <Button size="sm" variant="secondary" icon={<Download size={12} />} onClick={() => exportarDetalhesLiderCSV(l)} title="Exportar detalhes">CSV</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {aba === 'eventos' && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>Relatórios de Eventos</h3>
          <p>Em desenvolvimento. Incluirá: eventos por organizador, por período, por status, inscrições, financeiro.</p>
        </div>
      )}

      {aba === 'auditoria' && (
        <AuditDashboard toast={toast} />
      )}
    </div>
  );
}

const AuditDashboard: React.FC<{ toast: (msg: string, type: 'ok' | 'err' | 'warn') => void }> = ({ toast }) => {
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [filtros, setFiltros] = useState({
    acao: '',
    entidade: '',
    entidadeId: '',
    userId: '',
    resultado: '',
    ip: '',
    dataInicio: '',
    dataFim: '',
  });
  const [totalPages, setTotalPages] = useState(0);

  const fetchAuditoria = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      if (filtros.acao) params.set('acao', filtros.acao);
      if (filtros.entidade) params.set('entidade', filtros.entidade);
      if (filtros.entidadeId) params.set('entidadeId', filtros.entidadeId);
      if (filtros.userId) params.set('userId', filtros.userId);
      if (filtros.resultado) params.set('resultado', filtros.resultado);
      if (filtros.ip) params.set('ip', filtros.ip);
      if (filtros.dataInicio) params.set('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params.set('dataFim', filtros.dataFim);

      const res = await fetch(`/api/gestao/auditoria?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRegistros(data.registros || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 0);
      } else {
        toast('Erro ao buscar auditoria', 'err');
      }
    } catch (e) {
      toast('Erro de conexão', 'err');
    } finally {
      setLoading(false);
    }
  }, [page, filtros, toast]);

  useEffect(() => { fetchAuditoria(); }, [fetchAuditoria]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ exportar: 'true' });
      if (filtros.acao) params.set('acao', filtros.acao);
      if (filtros.entidade) params.set('entidade', filtros.entidade);
      if (filtros.entidadeId) params.set('entidadeId', filtros.entidadeId);
      if (filtros.userId) params.set('userId', filtros.userId);
      if (filtros.resultado) params.set('resultado', filtros.resultado);
      if (filtros.ip) params.set('ip', filtros.ip);
      if (filtros.dataInicio) params.set('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params.set('dataFim', filtros.dataFim);

      const res = await fetch(`/api/gestao/auditoria?${params}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast('Exportação concluída', 'ok');
      } else {
        toast('Erro ao exportar', 'err');
      }
    } catch (e) {
      toast('Erro ao exportar', 'err');
    }
  };

  const getResultadoColor = (resultado: string) => {
    if (resultado === 'SUCESSO') return { bg: 'rgba(76,175,80,0.15)', color: '#81c784' };
    if (resultado === 'NEGADO') return { bg: 'rgba(244,67,54,0.15)', color: '#e57373' };
    return { bg: 'rgba(158,158,158,0.15)', color: '#9e9e9e' };
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Ação</label>
          <input type="text" value={filtros.acao} onChange={e => setFiltros(p => ({ ...p, acao: e.target.value }))} placeholder="Filtrar por ação" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Entidade</label>
          <input type="text" value={filtros.entidade} onChange={e => setFiltros(p => ({ ...p, entidade: e.target.value }))} placeholder="Filtrar por entidade" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Entidade ID</label>
          <input type="text" value={filtros.entidadeId} onChange={e => setFiltros(p => ({ ...p, entidadeId: e.target.value }))} placeholder="Filtrar por ID" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Resultado</label>
          <select value={filtros.resultado} onChange={e => setFiltros(p => ({ ...p, resultado: e.target.value }))} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
            <option value="">Todos</option>
            <option value="SUCESSO">SUCESSO</option>
            <option value="NEGADO">NEGADO</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>IP</label>
          <input type="text" value={filtros.ip} onChange={e => setFiltros(p => ({ ...p, ip: e.target.value }))} placeholder="Filtrar por IP" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Início</label>
          <input type="date" value={filtros.dataInicio} onChange={e => setFiltros(p => ({ ...p, dataInicio: e.target.value }))} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Fim</label>
          <input type="date" value={filtros.dataFim} onChange={e => setFiltros(p => ({ ...p, dataFim: e.target.value }))} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={fetchAuditoria} disabled={loading}>Atualizar</Button>
        <Button icon={<Download size={16} />} onClick={handleExport}>Exportar CSV</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-primary)' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Registros</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{total}</p>
        </div>
        <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #4caf50' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Sucessos</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#81c784' }}>{registros.filter(r => r.resultado === 'SUCESSO').length}</p>
        </div>
        <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #e74c3c' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Negados</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e57373' }}>{registros.filter(r => r.resultado === 'NEGADO').length}</p>
        </div>
        <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-primary)' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Página</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{page} / {totalPages}</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Carregando auditoria...</div>
      ) : registros.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Nenhum registro de auditoria encontrado.</div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Quando</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Usuário</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Ação</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Entidade</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Entidade ID</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Organização</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Resultado</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>IP</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {registros.map(r => {
                const resColor = getResultadoColor(r.resultado || '');
                return (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>{new Date(r.createdAt).toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '0.5rem' }}>{r.user?.name || '—'}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 500 }}>{r.acao}</td>
                    <td style={{ padding: '0.5rem' }}>{r.entidade}</td>
                    <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.7rem' }}>{r.entidadeId?.slice(0, 8) || '—'}</td>
                    <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>{r.organizacao?.nome || '—'}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.6rem', fontWeight: 600, background: resColor.bg, color: resColor.color }}>
                        {r.resultado}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.ip || '—'}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <Button size="sm" variant="secondary" icon={<Eye size={10} />} onClick={() => alert(JSON.stringify(r.detalhes || {}, null, 2))} title="Ver detalhes">Ver</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} icon={<ChevronDown size={16} />} style={{ transform: 'rotate(180deg)' }}>Anterior</Button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', color: 'var(--text-secondary)' }}>
            Página {page} de {totalPages}
          </span>
          <Button variant="secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} icon={<ChevronDown size={16} />}>Próxima</Button>
        </div>
      )}
    </div>
  );
};

function getResultadoColor(resultado: string) {
  if (resultado === 'SUCESSO') return { bg: 'rgba(76,175,80,0.15)', color: '#81c784' };
  if (resultado === 'NEGADO') return { bg: 'rgba(244,67,54,0.15)', color: '#e57373' };
  return { bg: 'rgba(158,158,158,0.15)', color: '#9e9e9e' };
}