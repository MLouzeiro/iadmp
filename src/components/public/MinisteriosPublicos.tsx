'use client';

import { useEffect, useState } from 'react';
import { Users, UserCheck } from 'lucide-react';

interface Ministerio {
  id: string;
  nome: string;
  descricao: string | null;
  responsavel: string | null;
}

/**
 * Grade pública de ministérios ativos. Retorna null quando não há ministérios.
 */
export default function MinisteriosPublicos({ slug, organizacaoId }: { slug?: string; organizacaoId?: string }) {
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (slug) params.set('slug', slug);
    else if (organizacaoId) params.set('organizacaoId', organizacaoId);
    const qs = params.toString();
    fetch(`/api/public/ministerios${qs ? `?${qs}` : ''}`)
      .then((r) => (r.ok ? r.json() : { ministerios: [] }))
      .then((d) => setMinisterios(Array.isArray(d.ministerios) ? d.ministerios : []))
      .catch(() => setMinisterios([]))
      .finally(() => setLoading(false));
  }, [slug, organizacaoId]);

  if (loading) {
    return (
      <div className="grid-3" aria-busy="true" aria-label="Carregando ministérios">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card" style={{ minHeight: 140, background: 'var(--bg-secondary)' }} />
        ))}
      </div>
    );
  }

  if (ministerios.length === 0) return null;

  return (
    <div className="grid-3">
      {ministerios.map((m) => (
        <div key={m.id} className="card pub-ministerio-card">
          <div className="pub-ministerio-icone">
            <Users size={26} />
          </div>
          <h3>{m.nome}</h3>
          {m.descricao && <p>{m.descricao}</p>}
          {m.responsavel && (
            <span className="pub-ministerio-responsavel">
              <UserCheck size={14} /> {m.responsavel}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
