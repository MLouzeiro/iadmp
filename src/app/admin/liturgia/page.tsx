'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SectionHead from '@/components/ui/SectionHead';
import { BookOpen, Plus, Calendar, Clock, User, Search, ChevronRight, Trash2, Copy, Eye, Play, FileText } from 'lucide-react';
import styles from './liturgia.module.css';

interface Liturgia {
  id: string;
  data: string;
  horarioInicio: string;
  horarioFimPrevisto?: string;
  tipoCulto: string;
  tema?: string;
  dirigente?: string;
  pregador?: string;
  status: string;
  congregacao?: string;
  organizacao: { id: string; nome: string };
  itens: any[];
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  EM_PREPARACAO: 'Em preparacao',
  PRONTA: 'Pronta',
  EM_ANDAMENTO: 'Em andamento',
  REALIZADA: 'Realizada',
  CANCELADA: 'Cancelada',
};

export default function LiturgiaPage() {
  const router = useRouter();
  const [liturgias, setLiturgias] = useState<Liturgia[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLiturgias = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busca) params.set('busca', busca);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await fetch(`/api/liturgia?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLiturgias(data.liturgias);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error('Erro ao buscar liturgias:', err);
    } finally {
      setLoading(false);
    }
  }, [busca, statusFilter, page]);

  useEffect(() => { fetchLiturgias(); }, [fetchLiturgias]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta liturgia?')) return;
    try {
      const res = await fetch(`/api/liturgia/${id}`, { method: 'DELETE' });
      if (res.ok) fetchLiturgias();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  const handleDuplicar = async (id: string) => {
    try {
      const res = await fetch(`/api/liturgia/${id}/duplicar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/liturgia/${data.liturgia.id}/editar`);
      }
    } catch (err) {
      console.error('Erro ao duplicar:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return { dia: d.getDate(), mes: MESES[d.getMonth()], ano: d.getFullYear() };
  };

  return (
    <div>
      <SectionHead icon={<BookOpen size={24} />} title="Liturgia">
        <Link href="/admin/liturgia/nova" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', background: 'var(--gradient-gold)', color: '#000', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none', transition: 'var(--transition)' }}>
          <Plus size={16} /> Nova Liturgia
        </Link>
      </SectionHead>

      <div className={styles.filtersBar}>
        <div className={styles.filterGroup} style={{ flex: 1, minWidth: 200 }}>
          <input type="text" placeholder="Buscar por tema, dirigente, pregador..." value={busca} onChange={e => { setBusca(e.target.value); setPage(1); }} style={{ padding: '0.6rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem', width: '100%' }} />
        </div>
        <div className={styles.filterGroup}>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
            <option value="">Todos os status</option>
            <option value="RASCUNHO">Rascunho</option>
            <option value="EM_PREPARACAO">Em preparacao</option>
            <option value="PRONTA">Pronta</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="REALIZADA">Realizada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando...</div>
      ) : liturgias.length === 0 ? (
        <div className={styles.emptyState}>
          <BookOpen size={48} className={styles.emptyStateIcon} />
          <h3 className={styles.emptyStateTitle}>Nenhuma liturgia encontrada</h3>
          <p className={styles.emptyStateDesc}>Crie a primeira programacao de culto</p>
          <Link href="/admin/liturgia/nova" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'var(--gradient-gold)', color: '#000', borderRadius: 'var(--radius-sm)', fontWeight: 600, textDecoration: 'none' }}>
            <Plus size={16} /> Nova Liturgia
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.liturgiaList}>
            {liturgias.map(l => {
              const dt = formatDate(l.data);
              return (
                <div key={l.id} className={styles.liturgiaCard} onClick={() => router.push(`/admin/liturgia/${l.id}`)}>
                  <div className={styles.liturgiaCardData}>
                    <div className={styles.liturgiaCardDia}>{dt.dia}</div>
                    <div className={styles.liturgiaCardMes}>{dt.mes}</div>
                  </div>
                  <div className={styles.liturgiaCardInfo}>
                    <div className={styles.liturgiaCardTema}>{l.tema || 'Sem tema'}</div>
                    <div className={styles.liturgiaCardDetalhes}>
                      <span><Clock size={13} /> {l.horarioInicio}</span>
                      {l.dirigente && <span><User size={13} /> {l.dirigente}</span>}
                      {l.pregador && <span><BookOpen size={13} /> {l.pregador}</span>}
                      <span className={`${styles.statusBadge} ${styles[`status${l.status}`]}`}>{STATUS_LABELS[l.status]}</span>
                    </div>
                  </div>
                  <div className={styles.liturgiaCardActions} onClick={e => e.stopPropagation()}>
                    <button onClick={() => router.push(`/admin/liturgia/${l.id}`)} title="Visualizar" style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.4rem', color: 'var(--text-muted)', cursor: 'pointer', transition: 'var(--transition)' }}><Eye size={16} /></button>
                    <button onClick={() => handleDuplicar(l.id)} title="Duplicar" style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.4rem', color: 'var(--text-muted)', cursor: 'pointer', transition: 'var(--transition)' }}><Copy size={16} /></button>
                    <button onClick={() => handleDelete(l.id)} title="Excluir" style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.4rem', color: 'var(--text-muted)', cursor: 'pointer', transition: 'var(--transition)' }}><Trash2 size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '0.5rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', cursor: 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>Anterior</button>
              <span style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pagina {page} de {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '0.5rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', cursor: 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}>Proxima</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}