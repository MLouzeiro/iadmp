import type { Metadata } from 'next';
import SectionHead from '@/components/ui/SectionHead';
import { Calendar } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Eventos - IADMP',
  description: 'Confira os eventos da Igreja Assembleia de Deus Ministerio da Promessa',
};

async function getEventos() {
  try {
    const eventos = await prisma.evento.findMany({
      where: { publicarNoSite: true },
      include: { categoria: true },
      orderBy: { dataEvento: 'asc' },
    });
    return eventos;
  } catch {
    return [];
  }
}

const statusColors: Record<string, string> = {
  PLANEJADO: 'var(--color-secondary)',
  EM_ANDAMENTO: '#4caf50',
  CONCLUIDO: 'var(--text-muted)',
  CANCELADO: '#e74c3c',
};

export default async function EventosPage() {
  const eventos = await getEventos();

  return (
    <>
      <section className="header">
        <div className="header__container">
          <div className="header__content">
            <h2>Eventos</h2>
            <p>Confira os proximos eventos e atividades da igreja</p>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <SectionHead icon={<Calendar size={24} />} title="Nossos Eventos" />
          <div style={{ display: 'grid', gap: '1.5rem', marginTop: '2rem' }}>
            {eventos.map((evento) => (
              <div
                key={evento.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h3 style={{ color: 'var(--color-secondary)', marginBottom: '0.5rem' }}>{evento.nome}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {new Date(evento.dataEvento).toLocaleDateString('pt-BR')}
                    {evento.local && ` | ${evento.local}`}
                    {evento.tema && ` | Tema: ${evento.tema}`}
                  </p>
                  {evento.categoria && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {evento.categoria.nome}
                    </span>
                  )}
                </div>
                <span style={{
                  padding: '0.3rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  background: statusColors[evento.status] || 'var(--text-muted)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}>
                  {evento.status.replace('_', ' ')}
                </span>
              </div>
            ))}
            {eventos.length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
                Nenhum evento publicado no momento.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
