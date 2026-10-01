'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import SectionHead from '@/components/ui/SectionHead';
import { Mic, ArrowLeft, Calendar, User, BookOpen, ExternalLink, Trash2, Pencil, Send, Archive, Star, Share2, Copy, MessageCircle } from 'lucide-react';
import styles from '../pregacoes.module.css';

interface Pregacao {
  id: string;
  titulo: string;
  slug: string;
  descricao?: string;
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
  observacoes?: string;
  status: string;
  destaque: boolean;
  liturgia?: {
    id: string; tema?: string; data: string; horarioInicio: string;
    horarioFimPrevisto?: string; tipoCulto: string; dirigente?: string;
    pregador?: string; status: string; congregacao?: string;
  };
  pregador?: { id: string; name: string; email: string };
  organizacao: { id: string; nome: string };
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const STATUS_LABELS: Record<string, string> = { RASCUNHO: 'Rascunho', PUBLICADA: 'Publicada', ARQUIVADA: 'Arquivada' };

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
    /(?:youtu\.be\/)([^?\s]+)/,
    /(?:youtube\.com\/embed\/)([^?\s]+)/,
    /(?:youtube\.com\/shorts\/)([^?\s]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/.test(url);
}

export default function PregacaoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [pregacao, setPregacao] = useState<Pregacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareSupported, setShareSupported] = useState(false);

  useEffect(() => {
    setShareSupported(typeof navigator !== 'undefined' && !!navigator.share);
    fetch(`/api/comunicacao/pregacoes/${id}`)
      .then(r => r.json())
      .then(d => { setPregacao(d.pregacao); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleAction = async (action: string) => {
    try {
      const res = await fetch(`/api/comunicacao/pregacoes/${id}/${action}`, { method: 'POST' });
      if (res.ok) {
        const d = await res.json();
        setPregacao(d.pregacao);
      }
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta pregação?')) return;
    try {
      const res = await fetch(`/api/comunicacao/pregacoes/${id}`, { method: 'DELETE' });
      if (res.ok) router.push('/admin/comunicacao/pregacoes');
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: pregacao?.titulo, text: `${pregacao?.titulo} - ${pregacao?.pregadorNome || ''}`, url });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copiado!');
    }
  };

  const shareWhatsApp = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${pregacao?.titulo} - ${pregacao?.pregadorNome || ''}`);
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const formatDate = (d: string) => {
    const dt = new Date(d + 'T12:00:00');
    return `${dt.getDate()} ${MESES[dt.getMonth()]} ${dt.getFullYear()}`;
  };

  const getReferencia = () => {
    if (!pregacao?.referenciaLivro) return null;
    let ref = `${pregacao.referenciaLivro} ${pregacao.referenciaCapitulo || ''}`;
    if (pregacao.referenciaVersIni) ref += `:${pregacao.referenciaVersIni}`;
    if (pregacao.referenciaVersFim) ref += `-${pregacao.referenciaVersFim}`;
    return ref;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando...</div>;
  if (!pregacao) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Pregacao nao encontrada</div>;

  const ytId = pregacao.videoUrl ? extractYouTubeId(pregacao.videoUrl) : null;
  const isYt = pregacao.videoUrl ? isYouTubeUrl(pregacao.videoUrl) : false;

  return (
    <div className={styles.detailContainer}>
      <Link href="/admin/comunicacao/pregacoes" className={styles.detailBack}>
        <ArrowLeft size={16} /> Voltar para pregacoes
      </Link>

      {pregacao.capaUrl && (
        <div style={{ width: '100%', height: '300px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <img src={pregacao.capaUrl} alt={pregacao.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div className={styles.detailHeader}>
        <div>
          <h1 className={styles.detailTitle}>{pregacao.titulo}</h1>
          {pregacao.tema && <div className={styles.detailTema}>{pregacao.tema}</div>}
          <div className={styles.detailMeta}>
            {pregacao.pregadorNome && <span className={styles.detailMetaItem}><User size={16} /> {pregacao.pregadorNome}</span>}
            <span className={styles.detailMetaItem}><Calendar size={16} /> {formatDate(pregacao.data)}</span>
            <span className={styles.detailMetaItem} style={{ textTransform: 'capitalize' }}><Mic size={16} /> {pregacao.tipo}</span>
            <span className={`${styles.statusBadge} ${styles[`status${pregacao.status}`]}`}>{STATUS_LABELS[pregacao.status]}</span>
            {pregacao.destaque && <span className={`${styles.statusBadge} ${styles.statusDestaque}`}><Star size={11} /> Destaque</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          {pregacao.status === 'RASCUNHO' && (
            <button onClick={() => handleAction('publicar')} className={`${styles.btn} ${styles.btnPrimary}`}><Send size={14} /> Publicar</button>
          )}
          {pregacao.status === 'PUBLICADA' && (
            <>
              {!pregacao.destaque && <button onClick={() => handleAction('destacar')} className={`${styles.btn} ${styles.btnSecondary}`}><Star size={14} /> Destacar</button>}
              {pregacao.destaque && <button onClick={() => handleAction('remover-destaque')} className={`${styles.btn} ${styles.btnSecondary}`}><Star size={14} /> Remover destaque</button>}
              <button onClick={() => handleAction('arquivar')} className={`${styles.btn} ${styles.btnSecondary}`}><Archive size={14} /> Arquivar</button>
            </>
          )}
          <Link href={`/admin/comunicacao/pregacoes/${id}/editar`} className={`${styles.btn} ${styles.btnSecondary}`}><Pencil size={14} /> Editar</Link>
          <button onClick={handleDelete} className={`${styles.btn} ${styles.btnSecondary}`} style={{ color: '#e74c3c', borderColor: 'rgba(231,76,60,0.3)' }}><Trash2 size={14} /></button>
        </div>
      </div>

      {getReferencia() && (
        <div className={styles.detailReferencia}>
          <div className={styles.detailReferenciaIcon}><BookOpen size={20} color="#000" /></div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Texto base</div>
            <div className={styles.detailReferenciaText}>{getReferencia()}</div>
          </div>
        </div>
      )}

      {pregacao.videoUrl && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>Video</div>
          {isYt && ytId ? (
            <div className={styles.videoContainer}>
              <iframe
                className={styles.videoIframe}
                src={`https://www.youtube.com/embed/${ytId}`}
                title={pregacao.titulo}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <a href={pregacao.videoUrl} target="_blank" rel="noopener noreferrer" className={styles.videoBtn}>
              <ExternalLink size={16} /> Assistir video
            </a>
          )}
        </div>
      )}

      {pregacao.descricao && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>Descricao</div>
          <div className={styles.detailDescricao}>{pregacao.descricao}</div>
        </div>
      )}

      {pregacao.liturgia && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>Culto Relacionado</div>
          <Link href={`/admin/liturgia/${pregacao.liturgia.id}`} className={styles.liturgiaLink}>
            <BookOpen size={20} style={{ color: 'var(--color-primary)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{pregacao.liturgia.tema || pregacao.liturgia.tipoCulto}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {formatDate(pregacao.liturgia.data)} — {pregacao.liturgia.horarioInicio}
              </div>
            </div>
            <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
          </Link>
        </div>
      )}

      {pregacao.observacoes && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>Observacoes</div>
          <div className={styles.detailDescricao}>{pregacao.observacoes}</div>
        </div>
      )}

      <div className={styles.detailSection}>
        <div className={styles.detailSectionTitle}>Compartilhar</div>
        <div className={styles.shareButtons}>
          {shareSupported && (
            <button onClick={handleShare} className={styles.shareBtn}><Share2 size={14} /> Compartilhar</button>
          )}
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copiado!'); }} className={styles.shareBtn}><Copy size={14} /> Copiar link</button>
          <button onClick={shareWhatsApp} className={styles.shareBtn}><MessageCircle size={14} /> WhatsApp</button>
          <button onClick={shareFacebook} className={styles.shareBtn}>📘 Facebook</button>
        </div>
      </div>
    </div>
  );
}
