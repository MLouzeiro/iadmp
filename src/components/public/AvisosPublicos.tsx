'use client';

import { useEffect, useState } from 'react';
import { Megaphone, AlertTriangle } from 'lucide-react';

interface AvisoPublico {
  id: string;
  titulo: string;
  descricao: string;
  imagem: string | null;
  categoria: string | null;
  urgencia: string;
  destaque: boolean;
  comecaEm: string;
  terminaEm: string | null;
}

function publicQuery(slug?: string, organizacaoId?: string) {
  const params = new URLSearchParams();
  if (slug) params.set('slug', slug);
  else if (organizacaoId) params.set('organizacaoId', organizacaoId);
  return params.toString();
}

/**
 * Avisos públicos do site (publicarSite + ATIVO + janela de exibição).
 * Retorna null quando não há avisos — a seção some naturalmente.
 */
export default function AvisosPublicos({ slug, organizacaoId }: { slug?: string; organizacaoId?: string }) {
  const [avisos, setAvisos] = useState<AvisoPublico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qs = publicQuery(slug, organizacaoId);
    fetch(`/api/public/avisos${qs ? `?${qs}` : ''}`)
      .then((r) => (r.ok ? r.json() : { avisos: [] }))
      .then((d) => setAvisos(Array.isArray(d.avisos) ? d.avisos : []))
      .catch(() => setAvisos([]))
      .finally(() => setLoading(false));
  }, [slug, organizacaoId]);

  if (loading || avisos.length === 0) return null;

  return (
    <aside className="pub-avisos" aria-label="Avisos">
      <div className="pub-avisos-header">
        <Megaphone size={18} />
        <h3>Avisos</h3>
      </div>
      <ul className="pub-avisos-lista">
        {avisos.map((a) => (
          <li key={a.id} className={`pub-aviso-item${a.destaque ? ' destaque' : ''}`}>
            <div className="pub-aviso-topo">
              {a.urgencia === 'URGENTE' && (
                <span className="pub-aviso-badge urgente">
                  <AlertTriangle size={12} /> Urgente
                </span>
              )}
              {a.categoria && <span className="pub-aviso-categoria">{a.categoria}</span>}
            </div>
            <h4>{a.titulo}</h4>
            <p>{a.descricao}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
