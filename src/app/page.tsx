import Link from 'next/link';
import { Heart, ArrowRight } from 'lucide-react';
import { programs, values, leaders, congregations, getDailyVerse } from '@/data/site-data';

export default function Home() {
  const verse = getDailyVerse();

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: 'url(/images/iadmp/Slide/image1.jpg)' }} />
        <div className="hero-content fade-in">
          <h1>
            Igreja Assembleia de Deus<br />
            <span>Ministerio da Promessa</span>
          </h1>
          <p>Uma comunidade de fe, amor e esperanca, onde cada pessoa e acolhida e transformada pelo poder de Deus.</p>
          <div className="hero-buttons">
            <Link href="/sobre" className="btn btn-primary btn-lg">
              Conheca Nossa Historia <ArrowRight size={16} />
            </Link>
            <Link href="/eventos" className="btn btn-outline btn-lg">
              Proximos Eventos
            </Link>
          </div>
        </div>
      </section>

      {/* Versiculo do Dia */}
      <section className="verse-section">
        <div className="container">
          <div className="section-heading">
            <span className="label">Versiculo do Dia</span>
            <div className="divider" />
          </div>
          <div className="verse-card fade-in">
            <p className="reference">{verse.reference}</p>
            <p className="text">&ldquo;{verse.text}&rdquo;</p>
            <div className="reflection">
              <span className="reflection-label">Reflexao</span>
              {verse.reflection}
            </div>
          </div>
        </div>
      </section>

      {/* Programacao Semanal */}
      <section>
        <div className="container">
          <div className="section-heading">
            <span className="label">Programacao Semanal</span>
            <h2>Nossos Cultos e Reunioes</h2>
            <p>Confira nossa agenda semanal e participe conosco.</p>
            <div className="divider" />
          </div>
          <div className="grid-4">
            {programs.map((p) => (
              <div key={p.id} className="program-card">
                <p className="day">{p.day}</p>
                <h3>{p.title}</h3>
                <p>As {p.time}</p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Congregacoes */}
      <section style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-heading">
            <span className="label">Nossas Congregacoes</span>
            <h2>Igreja em Comunhao</h2>
            <p>Conheca nossas congregacoes e participe de uma perto de voce.</p>
            <div className="divider" />
          </div>
          <div className="grid-3">
            {congregations.map((c) => (
              <div key={c.id} className="congregation-card">
                <img src={c.image} alt={c.name} />
                <div className="overlay">
                  <h3>{c.name}</h3>
                  <p>{c.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Valores */}
      <section>
        <div className="container">
          <div className="section-heading">
            <span className="label">Nossos Valores</span>
            <h2>Fundamentos da Nossa Fe</h2>
            <p>Valores que guiam nossa caminhada espiritual.</p>
            <div className="divider" />
          </div>
          <div className="grid-2">
            {values.map((v) => (
              <div key={v.id} className="card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--gradient-gold-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Heart size={20} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>{v.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{v.description}</p>
                  <p style={{ color: 'var(--color-primary)', fontSize: '0.8rem', fontStyle: 'italic' }}>{v.verse}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lideranca (preview) */}
      <section style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-heading">
            <span className="label">Nossa Lideranca</span>
            <h2>Servos de Deus</h2>
            <p>Conheca aqueles que guiem nossa comunidade com amor e dedicao.</p>
            <div className="divider" />
          </div>
          <div className="grid-4">
            {leaders.slice(0, 4).map((l) => (
              <div key={l.id} className="leader-card">
                {l.image ? (
                  <img src={l.image} alt={l.name} className="leader-avatar" />
                ) : (
                  <div className="leader-avatar-placeholder">
                    {l.name.charAt(0)}
                  </div>
                )}
                <h3>{l.name}</h3>
                <p className="role">{l.role}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link href="/lideranca" className="btn btn-outline">
              Ver Toda Lideranca <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
