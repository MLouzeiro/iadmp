'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import EventosList from '@/components/public/EventosList';
import styles from '../page.module.css';

interface Evento {
  id: string;
  nome: string;
  tema: string | null;
  dataInicio: string;
  dataEvento: string;
  dataFim: string | null;
  inscricoesAbremEm: string | null;
  inscricoesFechamEm: string | null;
  aceitaInscricoes: boolean;
  local: string | null;
  status: string;
  preletores: string[];
}

export default function IgrejaEventosPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [igrejaNome, setIgrejaNome] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/public/church-info?slug=${slug}`).then(r => r.json()),
      fetch(`/api/public/eventos?slug=${slug}&limit=50`).then(r => r.json()),
    ]).then(([churchRes, eventosRes]) => {
      if (churchRes.organizacao) setIgrejaNome(churchRes.organizacao.nome);
      if (eventosRes.eventos) setEventos(eventosRes.eventos);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PLANEJADO: 'Planejado',
      EM_ANDAMENTO: 'Em Andamento',
      CONCLUIDO: 'Concluído',
      CANCELADO: 'Cancelado',
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PLANEJADO': return 'info';
      case 'EM_ANDAMENTO': return 'warning';
      case 'CONCLUIDO': return 'success';
      case 'CANCELADO': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando eventos...</div>;
  }

  return (
    <>
      <section className={styles.sectionHeader} style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', color: 'var(--text-primary)' }}>
          Eventos - {igrejaNome}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Confira a programação e participe conosco.</p>
      </section>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {eventos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3>Nenhum evento programado</h3>
            <p>Volte em breve para ver as novidades.</p>
          </div>
        ) : (
          eventos.map((evento) => (
            <article key={evento.id} className={styles.eventoCard}>
              <div className={styles.eventoCardHeader}>
                <div>
                  <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                    {evento.nome}
                  </h2>
                  {evento.tema && <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{evento.tema}</p>}
                </div>
                <span className={`${styles.statusBadge} ${styles[getStatusVariant(evento.status)]}`}>
                  {getStatusLabel(evento.status)}
                </span>
              </div>

              <div className={styles.eventoCardMeta}>
                <div className={styles.metaItem}>
                  <Calendar size={16} /> {formatDate(evento.dataEvento)}
                  {evento.dataFim && ` a ${formatDate(evento.dataFim)}`}
                </div>
                {evento.local && (
                  <div className={styles.metaItem}>
                    <MapPin size={16} /> {evento.local}
                  </div>
                )}
                {evento.inscricoesAbremEm && evento.inscricoesFechamEm && (
                  <div className={styles.metaItem}>
                    <Clock size={16} />
                    Inscrições: {formatDate(evento.inscricoesAbremEm)} a {formatDate(evento.inscricoesFechamEm)}
                  </div>
                )}
              </div>

              {evento.preletores && evento.preletores.length > 0 && (
                <div className={styles.eventoPreletores}>
                  <strong style={{ fontSize: '0.85rem' }}>Preletores:</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {evento.preletores.join(', ')}
                  </span>
                </div>
              )}

              {evento.aceitaInscricoes && (
                <Link href={`/igreja/${slug}/eventos/${evento.id}`} className={styles.btnInscricao}>
                  <ArrowRight size={14} /> Inscrever-se
                </Link>
              )}
            </article>
          ))
        )}
      </div>
    </>
  );
}