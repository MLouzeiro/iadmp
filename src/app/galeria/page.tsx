import type { Metadata } from 'next';
import GaleriaGrid from '@/components/public/GaleriaGrid';

export const metadata: Metadata = {
  title: 'Galeria - IADMP',
  description: 'Galeria de fotos da Igreja Assembleia de Deus Ministério da Promessa.',
};

export default function GaleriaPage() {
  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>Galeria</h1>
          <p>Momentos da nossa igreja em imagens.</p>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="section-heading">
            <span className="label">Momentos</span>
            <h2>Nossa História em Imagens</h2>
            <p>Registros dos momentos mais especiais da nossa comunhão.</p>
            <div className="divider" />
          </div>

          <GaleriaGrid />
        </div>
      </section>
    </>
  );
}
