import SectionHead from '@/components/ui/SectionHead';
import { BookOpen, Calendar, Users, Heart } from 'lucide-react';

const programs = [
  { id: 1, title: 'Consagracoes', info: 'Segunda, Quarta e Sabado (as 06:00)' },
  { id: 2, title: 'Terca-Feira - Culto de Doutrina', info: 'As 19:30' },
  { id: 3, title: 'Sexta-Feira - Circulo de Oração', info: 'As 19:30' },
  { id: 4, title: 'Domingo', info: 'As 18:30' },
];

const values = [
  { id: 1, title: 'Adoracao', desc: 'Exaltem o nome do Senhor em espirito e verdade.' },
  { id: 2, title: 'Comunhao', desc: 'Unidos em Cristo, fortalecemos a fe juntos.' },
  { id: 3, title: 'Obediencia', desc: 'Seguindo a Palavra de Deus em todas as coisas.' },
  { id: 4, title: 'Transformacao', desc: 'Renovados pela renovacao da mente.' },
];

export default function Home() {
  return (
    <>
      <section className="home-hero" style={{ marginTop: 'var(--header-height)', padding: '8rem 0', textAlign: 'center' }}>
        <div className="container">
          <h1 style={{ marginBottom: '1rem' }}>IADMP</h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Igreja Assembleia de Deus Ministerio da Promessa
          </p>
          <a href="/sobre" className="btn lg">Conheca Nossa Historia</a>
        </div>
      </section>

      <section style={{ marginTop: '4rem' }}>
        <div className="container">
          <SectionHead icon={<Calendar size={24} />} title="Programacao Semanal" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            {programs.map((p) => (
              <div key={p.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'center' }}>
                <h3 style={{ color: 'var(--color-secondary)', marginBottom: '0.5rem' }}>{p.title}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{p.info}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <SectionHead icon={<Heart size={24} />} title="Nossos Valores" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            {values.map((v) => (
              <div key={v.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center' }}>
                <h3 style={{ color: 'var(--color-secondary)', marginBottom: '0.5rem' }}>{v.title}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
