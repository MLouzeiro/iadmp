import type { Metadata } from 'next';
import { leaders } from '@/data/site-data';

export const metadata: Metadata = {
  title: 'Lideranca - IADMP',
  description: 'Conheca a lideranca da Igreja Assembleia de Deus Ministerio da Promessa.',
};

export default function LiderancaPage() {
  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>Nossa Lideranca</h1>
          <p>Servos de Deus que guiem nossa comunidade com amor e dedicao.</p>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="grid-4">
            {leaders.map((leader) => (
              <div key={leader.id} className="leader-card">
                {leader.image ? (
                  <img src={leader.image} alt={leader.name} className="leader-avatar" />
                ) : (
                  <div className="leader-avatar-placeholder">
                    {leader.name.charAt(0)}
                  </div>
                )}
                <h3>{leader.name}</h3>
                <p className="role">{leader.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
