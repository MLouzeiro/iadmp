import type { Metadata } from 'next';
import SectionHead from '@/components/ui/SectionHead';
import { Images } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Galeria - IADMP',
  description: 'Galeria de fotos da Igreja Assembleia de Deus Ministerio da Promessa',
};

export default function GaleriaPage() {
  return (
    <>
      <section className="header">
        <div className="header__container">
          <div className="header__content">
            <h2>Galeria</h2>
            <p>Momentos especiais da nossa igreja</p>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <SectionHead icon={<Images size={24} />} title="Nossa Galeria" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '4rem' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '4/3', display: 'grid', placeItems: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>Foto {i}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
