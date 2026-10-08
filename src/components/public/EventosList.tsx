'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import Badge, { statusBadgeVariant } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { formatarDataCurta } from '@/lib/datas';
import { CountdownBadge } from '@/components/public/CountdownCard';

interface Evento {
  id: string;
  nome: string;
  tema?: string | null;
  dataEvento: string;
  dataFim?: string | null;
  inscricoesAbremEm?: string | null;
  inscricoesFechamEm?: string | null;
  aceitaInscricoes?: boolean;
  local?: string | null;
  status: string;
  preletores?: string | null;
}

function dataBR(iso: string) {
  return formatarDataCurta(iso);
}

export default function EventosList() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/eventos?limit=24')
      .then((r) => r.json())
      .then((d) => setEventos(d.eventos || []))
      .catch(() => setEventos([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <EmptyState title="Carregando eventos..." message="Buscando a programação da igreja." />;
  }

  if (eventos.length === 0) {
    return (
      <EmptyState
        icon={<Calendar size={30} />}
        title="Em breve"
        message="Novos eventos serão anunciados em breve. Fique atento!"
      />
    );
  }

  return (
    <div className="grid-3">
      {eventos.map((e) => (
        <Link key={e.id} href={`/eventos/${e.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <article className="card event-card" style={{ height: '100%', cursor: 'pointer' }}>
          <div className="event-card-top">
            <Badge variant={statusBadgeVariant(e.status)}>{e.status.replace(/_/g, ' ')}</Badge>
            <span className="event-date">{dataBR(e.dataEvento)}</span>
          </div>
          <h3 className="event-title">{e.nome}</h3>
          {e.tema && <p className="event-theme">{e.tema}</p>}
          {e.local && (
            <p className="event-local">
              <MapPin size={14} /> {e.local}
            </p>
          )}
          {e.preletores && <p className="event-prelec">Prele\u00e7\u00e3o: {e.preletores}</p>}
          <div style={{ marginTop: '0.65rem' }}>
            <CountdownBadge
              dataEvento={e.dataEvento}
              inscricoesAbremEm={e.inscricoesAbremEm}
              inscricoesFechamEm={e.inscricoesFechamEm}
              aceitaInscricoes={e.aceitaInscricoes}
            />
          </div>
        </article>
        </Link>
      ))}
    </div>
  );
}
