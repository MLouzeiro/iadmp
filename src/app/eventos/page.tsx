import type { Metadata } from 'next';
import EventosList from '@/components/public/EventosList';

export const metadata: Metadata = {
  title: 'Eventos - IADMP',
  description: 'Confira os eventos da Igreja Assembleia de Deus Ministério da Promessa.',
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
            <span className="label">Próximos Eventos</span>
            <h2>Calendario da Igreja</h2>
            <p>Todos os eventos e cultos da nossa comunidade.</p>
            <div className="divider" />
          </div>

          <EventosList />
        </div>
      </section>
    </>
  );
}
