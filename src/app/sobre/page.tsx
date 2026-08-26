import type { Metadata } from 'next';
import SectionHead from '@/components/ui/SectionHead';

export const metadata: Metadata = {
  title: 'Sobre - IADMP',
  description: 'Conheca mais sobre a Igreja Assembleia de Deus Ministerio da Promessa',
};

const aboutSections = [
  {
    title: 'Cafe da Manha',
    description: 'Um tempo de comunhao e adoracao ao Senhor, comecando o dia com fe e esperanca.',
    verse: 'Adorai ao Senhor na formosura da sua santidade. - 1 Cronica 16:29',
  },
  {
    title: 'Comunhao',
    description: 'A comunhao entre os irmaos e fundamental para o crescimento espiritual.',
    verse: 'Uma coisa peço ao Senhor: habitar na casa do Senhor todos os dias da minha vida. - Salmo 27:4',
  },
  {
    title: 'Obediencia',
    description: 'A obediencia a Palavra de Deus e o caminho para uma vida abencoada.',
    verse: 'Ame o Senhor, seu Deus, de todo o seu coracao. - Deuteronomio 11:1',
  },
];

export default function SobrePage() {
  return (
    <>
      <section className="header">
        <div className="header__container">
          <div className="header__content">
            <h2>Sobre Nós</h2>
            <p>Conheca a historia e os valores da nossa igreja</p>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div style={{ display: 'grid', gap: '4rem', marginTop: '4rem' }}>
            {aboutSections.map((section, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '3rem', height: '300px', display: 'grid', placeItems: 'center' }}>
                  <SectionHead icon={<span style={{ fontSize: '3rem' }}>{index === 0 ? '☕' : index === 1 ? '🤝' : '📖'}</span>} title="" />
                </div>
                <div>
                  <h3 style={{ color: 'var(--color-secondary)', marginBottom: '1rem' }}>{section.title}</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{section.description}</p>
                  <p style={{ fontStyle: 'italic', color: 'var(--color-secondary)', borderLeft: '3px solid var(--color-secondary)', paddingLeft: '1rem' }}>{section.verse}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
