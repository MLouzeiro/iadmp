'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin } from 'lucide-react';
import { formatarDataLonga, formatarHora } from '@/lib/datas';

interface Evento {
  id: string;
  nome: string;
  tema?: string;
  dataInicio: string;
  dataEvento: string;
  dataFim?: string;
  local?: string;
  status: string;
  preletores: string[];
}

function formatDate(dateStr: string): string {
  return formatarDataLonga(dateStr);
}

function formatTime(dateStr: string): string {
  return formatarHora(dateStr);
}

export default function EventosSection({ organizacaoId }: { organizacaoId?: string }) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEventos() {
      try {
        const url = organizacaoId
          ? `/api/public/eventos?organizacaoId=${organizacaoId}&limit=4`
          : '/api/public/eventos?limit=4';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setEventos(data.eventos);
        }
      } catch (err) {
        console.error('Erro ao buscar eventos:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEventos();
  }, [organizacaoId]);

  if (loading) {
    return (
      <section>
        <div className="container">
          <div className="section-heading">
            <span className="label">Próximas Programações</span>
            <h2>Eventos</h2>
            <div className="divider" />
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="container">
        <div className="section-heading">
          <span className="label">Próximas Programações</span>
          <h2>Eventos</h2>
          <p>Confira nossas próximas programações e participe conosco.</p>
          <div className="divider" />
        </div>

        {eventos.length > 0 ? (
          <div className="grid-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {eventos.map(ev => (
              <div key={ev.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  <Calendar size={14} />
                  {formatDate(ev.dataEvento)}
                </div>
                <h3 style={{ fontSize: '1.1rem' }}>{ev.nome}</h3>
                {ev.tema && <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{ev.tema}</p>}
                {ev.local && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <MapPin size={12} /> {ev.local}
                  </p>
                )}
                {ev.preletores.length > 0 && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {ev.preletores.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Calendar size={48} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Em Breve</h3>
            <p>Novos eventos serao anunciados em breve.</p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link href="/eventos" className="btn btn-outline">
            Ver todos os eventos
          </Link>
        </div>
      </div>
    </section>
  );
}
