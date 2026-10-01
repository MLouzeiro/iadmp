'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Calendar } from 'lucide-react';

interface Pregacao {
  id: string;
  titulo: string;
  slug: string;
  descricao?: string;
  tema?: string;
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
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?#]+)/);
  return match ? match[1] : null;
}

export default function PregacoesSection({ organizacaoId }: { organizacaoId: string }) {
  const [pregacoes, setPregacoes] = useState<Pregacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPregacoes() {
      try {
        const res = await fetch(`/api/public/pregacoes?organizacaoId=${organizacaoId}&limit=4`);
        if (res.ok) {
          const data = await res.json();
          setPregacoes(data.pregacoes);
        }
      } catch (err) {
        console.error('Erro ao buscar pregacoes:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPregacoes();
  }, [organizacaoId]);

  if (loading) {
    return (
      <section>
        <div className="container">
          <div className="section-heading">
            <span className="label">Ultimas Pregacoes</span>
            <h2>Palavra de Deus</h2>
            <div className="divider" />
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</p>
        </div>
      </section>
    );
  }

  if (pregacoes.length === 0) return null;

  return (
    <section>
      <div className="container">
        <div className="section-heading">
          <span className="label">Ultimas Pregacoes</span>
          <h2>Palavra de Deus</h2>
          <p>Ouça as ultimas mensagens pregadas na nossa comunidade.</p>
          <div className="divider" />
        </div>
        <div className="grid-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {pregacoes.map(p => (
            <div key={p.id} className="pregacao-card">
              {p.capaUrl ? (
                <img src={p.capaUrl} alt={p.titulo} className="capa" />
              ) : (
                <div className="capa-placeholder">
                  <Play size={32} style={{ color: 'var(--color-primary)', opacity: 0.5 }} />
                </div>
              )}
              <div className="info">
                <h3>{p.titulo}</h3>
                <div className="meta">
                  {p.pregadorNome && <span>{p.pregadorNome}</span>}
                  <span><Calendar size={12} /> {formatDate(p.data)}</span>
                </div>
                {getReference(p) && (
                  <p className="referencia-biblica">{getReference(p)}</p>
                )}
                <div className="actions">
                  {p.videoUrl && (
                    <a href={p.videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                      <Play size={14} /> Assistir
                    </a>
                  )}
                  <Link href={`/pregacoes/${p.slug}`} className="btn btn-outline btn-sm">
                    Detalhes
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link href="/pregacoes" className="btn btn-outline">
            Ver todas as pregacoes
          </Link>
        </div>
      </div>
    </section>
  );
}
