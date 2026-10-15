'use client';

import { useEffect, useState } from 'react';
import { Clock, Mic2 } from 'lucide-react';

interface ProgramacaoItem {
  id: string;
  data: string;
  horarioInicio: string | null;
  horarioFimPrevisto: string | null;
  tipoCulto: string;
  tema: string | null;
  dirigente: string | null;
  pregador: string | null;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatarDia(iso: string) {
  const d = new Date(iso);
  return {
    diaSemana: DIAS_SEMANA[d.getDay()] || '',
    diaMes: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
  };
}

/**
 * Programação pública de cultos/liturgias futuras (status != RASCUNHO/CANCELADA).
 * Retorna null quando não há programação — sem seção fantasma.
 */
export default function ProgramacaoPublica({ slug, organizacaoId }: { slug?: string; organizacaoId?: string }) {
  const [programacao, setProgramacao] = useState<ProgramacaoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (slug) params.set('slug', slug);
    else if (organizacaoId) params.set('organizacaoId', organizacaoId);
    const qs = params.toString();
    fetch(`/api/public/programacao${qs ? `?${qs}` : ''}`)
      .then((r) => (r.ok ? r.json() : { programacao: [] }))
      .then((d) => setProgramacao(Array.isArray(d.programacao) ? d.programacao : []))
      .catch(() => setProgramacao([]))
      .finally(() => setLoading(false));
  }, [slug, organizacaoId]);

  if (loading) {
    return (
      <div className="grid-4" aria-busy="true" aria-label="Carregando programação">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card" style={{ minHeight: 120, background: 'var(--bg-secondary)' }} />
        ))}
      </div>
    );
  }

  if (programacao.length === 0) return null;

  return (
    <div className="grid-4">
      {programacao.map((p) => {
        const { diaSemana, diaMes } = formatarDia(p.data);
        return (
          <div key={p.id} className="card pub-prog-card">
            <div className="pub-prog-data">
              <span className="pub-prog-dia">{diaSemana}</span>
              <span className="pub-prog-num">{diaMes}</span>
            </div>
            {p.horarioInicio && (
              <span className="pub-prog-hora">
                <Clock size={13} /> {p.horarioInicio}
                {p.horarioFimPrevisto ? ` – ${p.horarioFimPrevisto}` : ''}
              </span>
            )}
            <h3>{p.tipoCulto}</h3>
            {p.tema && <p className="pub-prog-tema">{p.tema}</p>}
            {(p.pregador || p.dirigente) && (
              <span className="pub-prog-pessoa">
                <Mic2 size={13} /> {p.pregador || p.dirigente}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
