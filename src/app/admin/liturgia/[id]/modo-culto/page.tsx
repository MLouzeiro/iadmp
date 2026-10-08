'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, X, Play, Pause, SkipForward } from 'lucide-react';
import styles from '../../liturgia.module.css';

const MOMENTO_LABELS: Record<string, string> = {
  ABERTURA: 'Abertura', LOUVOR: 'Louvor', ORACAO: 'Oração', DIZIMOS: 'Dízimos',
  ALAS: 'Alas', DINAMICA: 'Dinamica', MENSAGEM: 'Mensagem', RESPOSTA: 'Resposta',
  COMUNICADOS: 'Comunicados', BENCAO: 'Bênção', MUSICA_ESPECIAL: 'Música Especial',
  TESTEMUNHO: 'Testemunho', CEIA: 'Ceia', BAPTISMO: 'Batismo', OUTRO: 'Outro',
};

export default function ModoCultoPage() {
  const params = useParams();
  const id = params.id as string;
  const [liturgia, setLiturgia] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(false);

  useEffect(() => {
    fetch(`/api/liturgia/${id}/modo-culto`).then(r => r.json()).then(d => setLiturgia(d.liturgia));
  }, [id]);

  useEffect(() => {
    if (!autoAdvance || !liturgia) return;
    const item = liturgia.itens[currentIndex];
    if (!item?.duracaoPrevista) return;
    const timeout = setTimeout(() => {
      if (currentIndex < liturgia.itens.length - 1) setCurrentIndex(i => i + 1);
    }, item.duracaoPrevista * 60 * 1000);
    return () => clearTimeout(timeout);
  }, [autoAdvance, currentIndex, liturgia]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); setCurrentIndex(i => Math.min(i + 1, (liturgia?.itens?.length || 1) - 1)); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); setCurrentIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Escape') { window.location.href = `/admin/liturgia/${id}`; }
  }, [liturgia, id]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!liturgia) return <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem' }}>Carregando...</div>;

  const item = liturgia.itens[currentIndex];
  const total = liturgia.itens.length;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  const renderContent = () => {
    if (!item) return null;
    return (
      <>
        <div className={styles.worshipMomentoTipo}>{MOMENTO_LABELS[item.tipo] || item.tipo}</div>
        <div className={styles.worshipMomentoTitulo}>{item.titulo}</div>
        {item.responsavel && <div className={styles.worshipMomentoDetalhe}>Responsavel: {item.responsavel}</div>}
        {item.horarioPrevisto && <div className={styles.worshipMomentoDetalhe}>Horario: {item.horarioPrevisto}</div>}
        {item.musica?.letra && <div className={styles.worshipMusicaLetra}>{item.musica.letra}</div>}
        {item.referenciaBiblica && <div className={styles.worshipMomentoDetalhe}>{item.referenciaBiblica}</div>}
        {item.textoBiblico && <div className={styles.worshipBiblia}>{item.textoBiblico}</div>}
        {item.descricao && <div className={styles.worshipMomentoDesc}>{item.descricao}</div>}
        {item.temaPregacao && <div className={styles.worshipMomentoDetalhe} style={{ color: '#D4A017', marginTop: '1rem', fontStyle: 'italic' }}>Tema: {item.temaPregacao}</div>}
      </>
    );
  };

  return (
    <div className={styles.worshipMode}>
      <div className={styles.worshipHeader}>
        <button onClick={() => window.location.href = `/admin/liturgia/${id}`} className={`${styles.worshipNavBtn} ${styles.sair}`}>
          <X size={16} /> Sair
        </button>
        <div>
          <div className={styles.worshipHeaderTitle}>{liturgia.tema || 'Modo Culto'}</div>
          <div className={styles.worshipHeaderMeta}>{liturgia.organizacao?.nome} - {new Date(liturgia.data + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={() => setAutoAdvance(!autoAdvance)} className={styles.worshipNavBtn} style={autoAdvance ? { background: 'rgba(212,160,23,0.3)', borderColor: 'rgba(212,160,23,0.6)' } : {}}>
            {autoAdvance ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{currentIndex + 1}/{total}</span>
        </div>
      </div>

      <div className={styles.worshipBody}>
        {renderContent()}
      </div>

      <div className={styles.worshipFooter}>
        <button onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))} disabled={currentIndex === 0} className={styles.worshipNavBtn}>
          <ChevronLeft size={16} /> Anterior
        </button>
        <div className={styles.worshipProgress}>
          <div className={styles.worshipProgressBar} style={{ width: `${progress}%` }} />
        </div>
        <button onClick={() => setCurrentIndex(i => Math.min(i + 1, total - 1))} disabled={currentIndex === total - 1} className={styles.worshipNavBtn}>
          Próximo <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}