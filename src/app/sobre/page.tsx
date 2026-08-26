import type { Metadata } from 'next';
import { aboutSections } from '@/data/site-data';

export const metadata: Metadata = {
  title: 'Sobre - IADMP',
  description: 'Conheca a historia e os valores da Igreja Assembleia de Deus Ministerio da Promessa.',
};

export default function SobrePage() {
  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>Sobre Nos</h1>
          <p>Conheca a historia e os valores da nossa igreja.</p>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="section-heading">
            <span className="label">Nossa Historia</span>
            <h2>Uma Comunidade de Fe</h2>
            <p>A Igreja Assembleia de Deus Ministerio da Promessa e uma comunidade dedicada a adoracao a Deus e ao servico ao proximo.</p>
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
    </>
  );
}
