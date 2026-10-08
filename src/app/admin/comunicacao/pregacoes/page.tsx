'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SectionHead from '@/components/ui/SectionHead';
import { Mic, Plus, Calendar, User, BookOpen, ExternalLink, Trash2, Eye, Star, Archive, Send } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import styles from './pregacoes.module.css';

interface Pregacao {
  id: string;
  titulo: string;
  slug: string;
  tema?: string;
  tipo: string;
  pregadorNome?: string;
  data: string;
  referenciaLivro?: string;
  referenciaCapitulo?: number;
  referenciaVersIni?: number;
  referenciaVersFim?: number;
  videoUrl?: string;
  capaUrl?: string;
  status: string;
  destaque: boolean;
  liturgia?: { id: string; tema?: string; data: string; horarioInicio: string; tipoCulto: string };
  organizacao: { id: string; nome: string };
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  PUBLICADA: 'Publicada',
  ARQUIVADA: 'Arquivada',
};

const TIPOS_PREGACAO = ['Pregação', 'Estudo bíblico', 'Devocional', 'Palavra', 'Sermão', 'Palestra', 'Conferência', 'Outro'];

export default function PregacoesPage() {
  const router = useRouter();
  const { toast, confirm } = useToast();
  const [pregacoes, setPregacoes] = useState<Pregacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [ordenar, setOrdenar] = useState('recentes');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPregacoes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busca) params.set('busca', busca);
      if (statusFilter) params.set('status', statusFilter);
      if (tipoFilter) params.set('tipo', tipoFilter);
      params.set('ordenar', ordenar);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await fetch(`/api/comunicacao/pregacoes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPregacoes(data.pregacoes);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error('Erro ao buscar pregações:', err);
    } finally {
      setLoading(false);
    }
  }, [busca, statusFilter, tipoFilter, ordenar, page]);

  useEffect(() => { fetchPregacoes(); }, [fetchPregacoes]);

  const handleDelete = async (id: string) => {
    confirm('Tem certeza que deseja excluir esta pregação?', async () => {
      try {
        const res = await fetch(`/api/comunicacao/pregacoes/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast('Pregação excluída.', 'ok');
          fetchPregacoes();
        } else {
          toast('Erro ao excluir pregação.', 'err');
        }
      } catch (err) {
        console.error('Erro ao excluir:', err);
        toast('Erro de conexão ao excluir.', 'err');
      }
    }, { title: 'Excluir pregação', danger: true });
  };

  const handleAction = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/comunicacao/pregacoes/${id}/${action}`, { method: 'POST' });
      if (res.ok) fetchPregacoes();
    } catch (err) {
      console.error('Erro ao executar ação:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
  };

  const getReferencia = (p: Pregacao) => {
    if (!p.referenciaLivro) return null;
    let ref = `${p.referenciaLivro} ${p.referenciaCapitulo || ''}`;
    if (p.referenciaVersIni) ref += `:${p.referenciaVersIni}`;
    if (p.referenciaVersFim) ref += `-${p.referenciaVersFim}`;
    return ref;
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <SectionHead icon={<Mic size={24} />} title="Pregações" />
        <Link href="/admin/comunicacao/pregacoes/nova" className={`${styles.btn} ${styles.btnPrimary}`}>
          <Plus size={16} /> Nova Pregação
        </Link>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.filterGroup} style={{ flex: 1, minWidth: 200 }}>
          <input type="text" placeholder="Buscar por título, pregador, tema..." value={busca} onChange={e => { setBusca(e.target.value); setPage(1); }} className={styles.searchInput} />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className={styles.selectFilter}>
          <option value="">Todos os status</option>
          <option value="RASCUNHO">Rascunho</option>
          <option value="PUBLICADA">Publicada</option>
          <option value="ARQUIVADA">Arquivada</option>
        </select>
        <select value={tipoFilter} onChange={e => { setTipoFilter(e.target.value); setPage(1); }} className={styles.selectFilter}>
          <option value="">Todos os tipos</option>
          {TIPOS_PREGACAO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={ordenar} onChange={e => setOrdenar(e.target.value)} className={styles.selectFilter}>
          <option value="recentes">Mais recentes</option>
          <option value="antigas">Mais antigas</option>
          <option value="título">Título</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando...</div>
      ) : pregacoes.length === 0 ? (
        <div className={styles.emptyState}>
          <Mic size={48} className={styles.emptyStateIcon} />
          <h3 className={styles.emptyStateTitle}>Nenhuma pregação encontrada</h3>
          <p className={styles.emptyStateDesc}>Cadastre a primeira pregação da igreja</p>
          <Link href="/admin/comunicacao/pregacoes/nova" className={`${styles.btn} ${styles.btnPrimary}`}>
            <Plus size={16} /> Nova Pregação
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.pregacaoList}>
            {pregacoes.map(p => (
              <div key={p.id} className={styles.pregacaoCard} onClick={() => router.push(`/admin/comunicacao/pregacoes/${p.id}`)}>
                {p.capaUrl && (
                  <div className={styles.pregacaoCapa}>
                    <img src={p.capaUrl} alt={p.titulo} />
                  </div>
                )}
                <div className={styles.pregacaoInfo}>
                  <div className={styles.pregacaoHeader}>
                    <h4 className={styles.pregacaoTitulo}>{p.titulo}</h4>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {p.destaque && <span className={`${styles.statusBadge} ${styles.statusDestaque}`}><Star size={11} /> Destaque</span>}
                      <span className={`${styles.statusBadge} ${styles[`status${p.status}`]}`}>{STATUS_LABELS[p.status]}</span>
                    </div>
                  </div>
                  {p.tema && <div className={styles.pregacaoTema}>{p.tema}</div>}
                  <div className={styles.pregacaoDetalhes}>
                    {p.pregadorNome && <span><User size={13} /> {p.pregadorNome}</span>}
                    <span><Calendar size={13} /> {formatDate(p.data)}</span>
                    {getReferencia(p) && <span><BookOpen size={13} /> {getReferencia(p)}</span>}
                    {p.liturgia && <span style={{ color: 'var(--color-primary)' }}>🕯 {p.liturgia.tema || p.liturgia.tipoCulto}</span>}
                  </div>
                </div>
                <div className={styles.pregacaoActions} onClick={e => e.stopPropagation()}>
                  <button onClick={() => router.push(`/admin/comunicacao/pregacoes/${p.id}`)} title="Ver detalhes" className={styles.actionBtn}><Eye size={16} /></button>
                  {p.status === 'RASCUNHO' && <button onClick={() => handleAction(p.id, 'publicar')} title="Publicar" className={styles.actionBtn}><Send size={14} /></button>}
                  {p.status === 'PUBLICADA' && <button onClick={() => handleAction(p.id, 'arquivar')} title="Arquivar" className={styles.actionBtn}><Archive size={14} /></button>}
                  {p.videoUrl && <a href={p.videoUrl} target="_blank" rel="noopener noreferrer" title="Assistir video" className={styles.actionBtn}><ExternalLink size={14} /></a>}
                  <button onClick={() => handleDelete(p.id)} title="Excluir" className={styles.actionBtn}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={`${styles.btn} ${styles.btnSecondary}`} style={{ opacity: page <= 1 ? 0.5 : 1 }}>Anterior</button>
              <span style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pagina {page} de {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className={`${styles.btn} ${styles.btnSecondary}`} style={{ opacity: page >= totalPages ? 0.5 : 1 }}>Próxima</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
