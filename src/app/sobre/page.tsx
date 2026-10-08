import type { Metadata } from 'next';
import { aboutSections } from '@/data/site-data';
import FaqSection from '@/components/public/FaqSection';

export const metadata: Metadata = {
  title: 'Sobre - IADMP',
  description: 'Conheça a história e os valores da Igreja Assembleia de Deus Ministério da Promessa.',
};

export default function SobrePage() {
  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>Sobre Nos</h1>
          <p>Conheça a história e os valores da nossa igreja.</p>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="section-heading">
            <span className="label">Nossa História</span>
            <h2>Uma Comunidade de Fé</h2>
            <p>A Igreja Assembleia de Deus Ministério da Promessa é uma comunidade dedicada à adoração a Deus e ao servico ao próximo.</p>
            <div className="divider" />
          </div>

          {aboutSections.map((section, index) => (
            <div
              key={section.id}
              className={`about-card ${index % 2 !== 0 ? 'reverse' : ''}`}
            >
              <img src={section.image} alt={section.title} />
              <div>
                <h3>{section.title}</h3>
                <p>{section.description}</p>
                <p className="verse">{section.verse}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-heading">
            <span className="label">Perguntas Frequentes</span>
            <h2>Dúvidas sobre a Fé</h2>
            <p>Respostas para as perguntas mais comuns sobre nossa fé.</p>
            <div className="divider" />
          </div>
          <FaqSection />
        </div>
      </section>
    </>
  );
}
