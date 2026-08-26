import type { Metadata } from 'next';
import { galleryImages } from '@/data/site-data';

export const metadata: Metadata = {
  title: 'Galeria - IADMP',
  description: 'Galeria de fotos da Igreja Assembleia de Deus Ministerio da Promessa.',
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
            <h2>Nossa Historia em Imagens</h2>
            <p>Registros dos momentos mais especiais da nossa comunhao.</p>
            <div className="divider" />
          </div>

          <div className="gallery-grid">
            {galleryImages.map((img) => (
              <div key={img.id} className="gallery-item">
                <img src={img.src} alt={img.alt} loading="lazy" />
                <div className="overlay">
                  <span>Foto {img.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
