import type { Metadata } from 'next';
import { Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Eventos - IADMP',
  description: 'Confira os eventos da Igreja Assembleia de Deus Ministerio da Promessa.',
};

export default function EventosPage() {
  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>Eventos</h1>
          <p>Confira nossos eventos e participe conosco.</p>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="section-heading">
            <span className="label">Proximos Eventos</span>
            <h2>Calendario da Igreja</h2>
            <p>Em breve novos eventos serao disponibilizados.</p>
            <div className="divider" />
          </div>

          <div className="empty-state">
            <Calendar size={64} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Em Breve</h3>
            <p>Novos eventos serao anunciados em breve. Fique atento!</p>
          </div>
        </div>
      </section>
    </>
  );
}
