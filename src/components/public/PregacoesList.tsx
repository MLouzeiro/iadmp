'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Calendar, BookOpen } from 'lucide-react';
import { useChurchInfo } from './ChurchInfo';

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

export default function PregacoesList() {
  const { organizacaoId } = useChurchInfo();
  const [pregacoes, setPregacoes] = useState<Pregacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizacaoId) return;
    async function fetchPregacoes() {
      try {
        const res = await fetch(`/api/public/pregacoes?organizacaoId=${organizacaoId}&limit=50`);
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

  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>Pregacoes</h1>
          <p>Mensagens pregadas na nossa comunidade.</p>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="section-heading">
            <span className="label">Palavra de Deus</span>
            <h2>Todas as Pregacoes</h2>
            <p>Ouça e assista as mensagens mais recentes.</p>
            <div className="divider" />
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</p>
          ) : pregacoes.length > 0 ? (
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
                      <p className="referencia-biblica"><BookOpen size={12} /> {getReference(p)}</p>
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
          ) : (
            <div className="empty-state">
              <Play size={64} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Em Breve</h3>
              <p>Novas pregacoes serao publicadas em breve.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
