'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SectionHead from '@/components/ui/SectionHead';
import { BookOpen, ArrowLeft, Edit, Copy, Play, Printer, Trash2, Clock, User, CheckCircle } from 'lucide-react';
import styles from '../liturgia.module.css';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: 'Rascunho', EM_PREPARACAO: 'Em preparacao', PRONTA: 'Pronta',
  EM_ANDAMENTO: 'Em andamento', REALIZADA: 'Realizada', CANCELADA: 'Cancelada',
};
const MOMENTO_LABELS: Record<string, string> = {
  ABERTURA: 'Abertura', LOUVOR: 'Louvor', ORACAO: 'Oracao', DIZIMOS: 'Dizimos',
  ALAS: 'Alas', DINAMICA: 'Dinamica', MENSAGEM: 'Mensagem', RESPOSTA: 'Resposta',
  COMUNICADOS: 'Comunicados', BENCAO: 'Bencao', MUSICA_ESPECIAL: 'Musica Especial',
  TESTEMUNHO: 'Testemunho', CEIA: 'Ceia', BAPTISMO: 'Batismo', OUTRO: 'Outro',
};

interface Liturgia {
  id: string;
  data: string;
  horarioInicio: string;
  horarioFimPrevisto?: string;
  tipoCulto: string;
  tema?: string;
  dirigente?: string;
  pregador?: string;
  responsavel?: string;
  observacoes?: string;
  congregacao?: string;
  status: string;
  organizacao: { id: string; nome: string };
  itens: { id: string; ordem: number; tipo: string; titulo: string; horarioPrevisto?: string; duracaoPrevista?: number; responsavel?: string; descricao?: string; observacoes?: string; musica?: any; referenciaBiblica?: string; textoBiblico?: string; temaPregacao?: string; status?: string }[];
}

export default function LiturgiaViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [liturgia, setLiturgia] = useState<Liturgia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/liturgia/${id}`).then(r => r.json()).then(d => {
      setLiturgia(d.liturgia);
      setLoading(false);
    });
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta liturgia?')) return;
    const res = await fetch(`/api/liturgia/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/liturgia');
  };

  const handleDuplicar = async () => {
    const res = await fetch(`/api/liturgia/${id}/duplicar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    if (res.ok) {
      const data = await res.json();
      router.push(`/admin/liturgia/${data.liturgia.id}/editar`);
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    const res = await fetch(`/api/liturgia/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const data = await res.json();
      setLiturgia(data.liturgia);
    } else {
      const err = await res.json();
      alert(err.error || 'Erro ao alterar status');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando...</div>;
  if (!liturgia) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Liturgia nao encontrada</div>;

  const dt = new Date(liturgia.data + 'T12:00:00');
  const dataFormatada = `${dt.getDate()} de ${['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][dt.getMonth()]} de ${dt.getFullYear()}`;

  const nextStatus: Record<string, string> = {
    RASCUNHO: 'EM_PREPARACAO', EM_PREPARACAO: 'PRONTA', PRONTA: 'EM_ANDAMENTO', EM_ANDAMENTO: 'REALIZADA',
  };

  return (
    <div>
      <SectionHead icon={<BookOpen size={24} />} title={liturgia.tema || 'Liturgia'}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/admin/liturgia" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
            <ArrowLeft size={16} /> Voltar
          </Link>
          <Link href={`/admin/liturgia/${id}/editar`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.85rem' }}>
            <Edit size={16} /> Editar
          </Link>
          <Link href={`/admin/liturgia/${id}/modo-culto`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: 'var(--gradient-gold)', color: '#000', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
            <Play size={16} /> Modo Culto
          </Link>
          <Link href={`/admin/liturgia/${id}/imprimir`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
            <Printer size={16} /> Imprimir
          </Link>
          <button onClick={handleDuplicar} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
            <Copy size={16} /> Duplicar
          </button>
          <button onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)', borderRadius: 'var(--radius-sm)', color: '#f44336', cursor: 'pointer', fontSize: '0.85rem' }}>
            <Trash2 size={16} />
          </button>
        </div>
      </SectionHead>

      {/* Status & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <span className={`${styles.statusBadge} ${styles[`status${liturgia.status}`]}`}>{STATUS_LABELS[liturgia.status]}</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {liturgia.status !== 'CANCELADA' && liturgia.status !== 'REALIZADA' && nextStatus[liturgia.status] && (
            <button onClick={() => handleChangeStatus(nextStatus[liturgia.status])} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'var(--gradient-gold)', color: '#000', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>
              <CheckCircle size={14} /> {liturgia.status === 'EM_ANDAMENTO' ? 'Finalizar' : 'Avancar Status'}
            </button>
          )}
          {liturgia.status !== 'CANCELADA' && liturgia.status !== 'REALIZADA' && (
            <button onClick={() => handleChangeStatus('CANCELADA')} style={{ padding: '0.5rem 1rem', background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)', borderRadius: 'var(--radius-sm)', color: '#f44336', cursor: 'pointer', fontSize: '0.8rem' }}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Dados Gerais */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Dados da Liturgia</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Data</div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>{dataFormatada}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Horario</div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>{liturgia.horarioInicio}{liturgia.horarioFimPrevisto ? ` - ${liturgia.horarioFimPrevisto}` : ''}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tipo</div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>{liturgia.tipoCulto}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Igreja</div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>{liturgia.organizacao.nome}</div>
          </div>
          {liturgia.dirigente && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dirigente</div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>{liturgia.dirigente}</div>
            </div>
          )}
          {liturgia.pregador && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pregador</div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>{liturgia.pregador}</div>
            </div>
          )}
          {liturgia.responsavel && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Responsavel</div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>{liturgia.responsavel}</div>
            </div>
          )}
        </div>
        {liturgia.observacoes && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--gradient-gold-soft)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {liturgia.observacoes}
          </div>
        )}
      </div>

      {/* Momentos */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Momentos ({liturgia.itens.length})
        </h3>
        <div className={styles.timeline}>
          {liturgia.itens.map((item) => (
            <div key={item.id} className={styles.momentoItem}>
              <div className={`${styles.momentoDot} ${item.status === 'CONCLUIDO' ? styles.concluido : item.status === 'EM_ANDAMENTO' ? styles.ativo : ''}`}>
                {item.ordem}
              </div>
              <div className={styles.momentoConteudo}>
                <div className={styles.momentoHeader}>
                  <div>
                    <span className={styles.momentoTipo}>{MOMENTO_LABELS[item.tipo] || item.tipo}</span>
                    <div className={styles.momentoTitulo}>{item.titulo}</div>
                  </div>
                  {item.status && item.status !== 'PENDENTE' && (
                    <span className={`${styles.statusBadge} ${styles[`statusMomento${item.status}`]}`}>{item.status}</span>
                  )}
                </div>
                <div className={styles.momentoMeta}>
                  {item.horarioPrevisto && <span><Clock size={13} /> {item.horarioPrevisto}</span>}
                  {item.duracaoPrevista && <span>{item.duracaoPrevista} min</span>}
                  {item.responsavel && <span><User size={13} /> {item.responsavel}</span>}
                  {item.musica && <span>♪ {item.musica.titulo}</span>}
                </div>
                {item.descricao && <div className={styles.momentoDesc}>{item.descricao}</div>}
                {item.temaPregacao && <div style={{ fontSize: '0.85rem', color: 'var(--color-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>Tema: {item.temaPregacao}</div>}
                {item.observacoes && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>{item.observacoes}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}