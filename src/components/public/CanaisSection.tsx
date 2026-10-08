'use client';

import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

interface Canal {
  id: string;
  tipo: string;
  nome: string;
  url: string;
  descricao?: string;
}

const TIPOS_ICONE: Record<string, string> = {
  youtube: '▶',
  instagram: '◎',
  facebook: '📘',
  tiktok: '🎵',
  whatsapp: '💬',
  site: '🌐',
  telegram: '✈',
};

export default function CanaisSection({ organizacaoId }: { organizacaoId: string }) {
  const [canais, setCanais] = useState<Canal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCanais() {
      try {
        const res = await fetch(`/api/public/canais?organizacaoId=${organizacaoId}`);
        if (res.ok) {
          const data = await res.json();
          setCanais(data.canais);
        }
      } catch (err) {
        console.error('Erro ao buscar canais:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCanais();
  }, [organizacaoId]);

  if (loading || canais.length === 0) return null;

  return (
    <section style={{ background: 'var(--bg-secondary)' }}>
      <div className="container">
        <div className="section-heading">
          <span className="label">Acompanhe Nossa Igreja</span>
          <h2>Canais Oficiais</h2>
          <p>Conecte-se conosco através das nossas redes sociais.</p>
          <div className="divider" />
        </div>
        <div className="grid-3" style={{ maxWidth: '800px', margin: '0 auto', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {canais.map(canal => (
            <a
              key={canal.id}
              href={canal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="canal-card"
            >
              <div className="canal-icon">
                {TIPOS_ICONE[canal.tipo] || '🔗'}
              </div>
              <div>
                <h3>{canal.nome}</h3>
                <p>{canal.descricao || canal.tipo}</p>
              </div>
              <ExternalLink size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)', flexShrink: 0 }} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
