'use client';

import { useState, useEffect } from 'react';
import { formatarDataCurta, formatarDataLonga } from '@/lib/datas';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, BookOpen, Play, Share2, MessageCircle } from 'lucide-react';

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
  destaque: boolean;
}

function formatDate(dateStr: string): string {
  return formatarDataLonga(dateStr);
}

function getReference(p: Pregacao): string | null {
  if (!p.referenciaLivro) return null;
  let ref = p.referenciaLivro;
  if (p.referenciaCapitulo) ref += ` ${p.referenciaCapitulo}`;
  if (p.referenciaVersIni) ref += `:${p.referenciaVersIni}`;
  if (p.referenciaVersFim && p.referenciaVersIni !== p.referenciaVersFim) ref += `-${p.referenciaVersFim}`;
  return ref;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?#]+)/);
  return match ? match[1] : null;
}

export default function PregacaoDetail({ slug }: { slug: string }) {
  const [pregacao, setPregacao] = useState<Pregacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    async function fetchPregacao() {
      try {
        const res = await fetch(`/api/public/pregacoes/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setPregacao(data.pregacao);
        }
      } catch (err) {
        console.error('Erro ao buscar pregação:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPregacao();
  }, [slug]);

  if (loading) {
    return (
      <section>
        <div className="container">
          <p style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            Carregando...
          </p>
        </div>
      </section>
    );
  }

  if (!pregacao) {
    return (
      <>
        <div className="page-header">
          <div className="container">
            <h1>Pregação</h1>
          </div>
        </div>
        <section>
          <div className="container">
            <div className="empty-state">
              <Play size={64} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Não encontrada</h3>
              <p>Esta pregação não está disponível.</p>
              <Link href="/pregacoes" className="btn btn-outline" style={{ marginTop: '1.5rem' }}>
                <ArrowLeft size={14} /> Voltar para pregações
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  const ytId = pregacao.videoUrl ? extractYouTubeId(pregacao.videoUrl) : null;
  const referencia = getReference(pregacao);

  const shareWhatsApp = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${pregacao.titulo}${pregacao.pregadorNome ? ` - ${pregacao.pregadorNome}` : ''}`);
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <Link href="/pregacoes" className="pregacao-back">
            <ArrowLeft size={16} /> Voltar para pregações
          </Link>
          <h1>{pregacao.titulo}</h1>
          {pregacao.tema && <p className="pregacao-tema">{pregacao.tema}</p>}
        </div>
      </div>

      <section>
        <div className="container container-md">
          <div className="pregacao-meta">
            {pregacao.pregadorNome && (
              <span><User size={14} /> {pregacao.pregadorNome}</span>
            )}
            <span><Calendar size={14} /> {formatDate(pregacao.data)}</span>
            <span style={{ textTransform: 'capitalize' }}>{pregacao.tipo}</span>
          </div>

          {referencia && (
            <div className="pregacao-referencia">
              <BookOpen size={18} />
              <div>
                <div className="pregacao-referencia-label">Texto base</div>
                <div className="pregacao-referencia-texto">{referencia}</div>
              </div>
            </div>
          )}

          {pregacao.videoUrl && (
            ytId ? (
              <div className="pregacao-video">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title={pregacao.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-média; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="pregacao-video-link">
                <a href={pregacao.videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  <Play size={16} /> Assistir video
                </a>
              </div>
            )
          )}

          {!pregacao.videoUrl && pregacao.capaUrl && (
            <img src={pregacao.capaUrl} alt={pregacao.titulo} className="pregacao-capa" />
          )}

          {pregacao.descricao && (
            <div className="pregacao-descricao">{pregacao.descricao}</div>
          )}

          <div className="pregacao-share">
            <span><Share2 size={14} /> Compartilhar</span>
            <button onClick={copyLink} className="btn btn-outline btn-sm">{copiado ? 'Link copiado!' : 'Copiar link'}</button>
            <button onClick={shareWhatsApp} className="btn btn-outline btn-sm">
              <MessageCircle size={14} /> WhatsApp
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
