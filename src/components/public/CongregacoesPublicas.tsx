'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, Church } from 'lucide-react';

interface CongPublica {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  logoUrl: string | null;
  endereco: string | null;
  telefone: string | null;
}

export default function CongregacoesPublicas() {
  const [lista, setLista] = useState<CongPublica[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/congregacoes')
      .then((r) => r.json())
      .then((d) => setLista(Array.isArray(d.organizacoes) ? d.organizacoes : []))
      .catch(() => setLista([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid-3" aria-busy="true" aria-label="Carregando congregações">
        {[1, 2, 3].map((i) => (
          <div key={i} className="congregation-card" style={{ minHeight: 220, background: 'var(--bg-secondary)' }} />
        ))}
      </div>
    );
  }

  if (lista.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
        <Church size={36} style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
        <p>Nenhuma congregação disponível no momento.</p>
        <p style={{ fontSize: '0.85rem' }}>Em breve novas casas de Deus farão parte da nossa rede.</p>
      </div>
    );
  }

  return (
    <div className="grid-3">
      {lista.map((c) => (
        <Link
          key={c.id}
          href={`/igreja/${c.slug}`}
          className="congregation-card"
          style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
        >
          {c.logoUrl ? (
            <img src={c.logoUrl} alt={c.nome} />
          ) : (
            <div
              style={{
                height: 160,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--gradient-gold-soft, rgba(200,150,12,.12))',
              }}
            >
              <Church size={42} style={{ color: 'var(--color-primary)', opacity: 0.7 }} />
            </div>
          )}
          <div className="overlay">
            <h3>{c.nome}</h3>
            {c.descricao && <p>{c.descricao}</p>}
            {c.endereco && (
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                <MapPin size={13} /> {c.endereco}
              </p>
            )}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginTop: '0.6rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--color-primary)',
              }}
            >
              Conhecer congregação <ArrowRight size={14} />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
