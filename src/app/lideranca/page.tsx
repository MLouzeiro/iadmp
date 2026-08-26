import type { Metadata } from 'next';
import SectionHead from '@/components/ui/SectionHead';
import { Users } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import Card from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Lideranca - IADMP',
  description: 'Conheca a lideranca da Igreja Assembleia de Deus Ministerio da Promessa',
};

async function getLideranca() {
  try {
    const lideres = await prisma.lideranca.findMany({
      where: { publico: true, ativo: true },
      orderBy: { ordemExibicao: 'asc' },
    });
    return lideres;
  } catch {
    return [];
  }
}

export default async function LiderancaPage() {
  const lideres = await getLideranca();

  return (
    <>
      <section className="header">
        <div className="header__container">
          <div className="header__content">
            <h2>Lideranca</h2>
            <p>Conheca os obreiros que servem na nossa igreja</p>
          </div>
        </div>
      </section>

      <section className="trainers">
        <div className="container">
          <SectionHead icon={<Users size={24} />} title="Nossos Obreiros" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginTop: '4rem' }}>
            {lideres.map((lider) => (
              <Card key={lider.id} className="trainer">
                <div className="trainer__img">
                  {lider.foto ? (
                    <img src={lider.foto} alt={lider.nome} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--gradient-gold)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '2rem' }}>
                      {lider.nome.charAt(0)}
                    </div>
                  )}
                </div>
                <h3>{lider.nome}</h3>
                <p>{lider.cargo}</p>
              </Card>
            ))}
            {lideres.length === 0 && (
              <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                Nenhum lider cadastrado.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
