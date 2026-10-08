'use client';

import { useState } from 'react';
import { galleryImages } from '@/data/site-data';
import Lightbox from '@/components/ui/Lightbox';

export default function GaleriaGrid() {
  const [aberta, setAberta] = useState<{ src: string; alt: string } | null>(null);

  return (
    <>
      <div className="gallery-grid">
        {galleryImages.map((img) => (
          <div
            key={img.id}
            className="gallery-item"
            onClick={() => setAberta({ src: img.src, alt: img.alt })}
          >
            <img src={img.src} alt={img.alt} loading="lazy" />
            <div className="overlay">
              <span>{img.alt}</span>
            </div>
          </div>
        ))}
      </div>

      <Lightbox open={!!aberta} title={aberta?.alt} onClose={() => setAberta(null)}>
        {aberta && <img src={aberta.src} alt={aberta.alt} />}
      </Lightbox>
    </>
  );
}
