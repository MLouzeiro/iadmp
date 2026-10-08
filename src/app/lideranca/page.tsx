import type { Metadata } from 'next';
import LiderancaList from '@/components/public/LiderancaList';
import { congregations } from '@/data/site-data';

export const metadata: Metadata = {
  title: 'Liderança - IADMP',
  description: 'Conheça a liderança da Igreja Assembleia de Deus Ministério da Promessa.',
};

export default function LiderancaPage() {
  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>Nossa Liderança</h1>
          <p>Servos de Deus que guiem nossa comunidade com amor e dedicao.</p>
        </div>
      </div>

      <section>
        <div className="container">
          <LiderancaList />
        </div>
      </section>

      <section style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-heading">
            <span className="label">Congregações</span>
            <h2>Onde Nos Reunimos</h2>
            <p>Conheça as congregações da nossa família de fé.</p>
            <div className="divider" />
          </div>
          <div className="grid-3">
            {congregations.map((c) => (
              <div key={c.id} className="congregation-card">
                {c.image && <img src={c.image} alt={c.name} />}
                <div className="overlay">
                  <h3>{c.name}</h3>
                  <p>{c.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
