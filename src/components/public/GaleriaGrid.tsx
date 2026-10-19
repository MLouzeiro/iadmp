'use client';

import { useEffect, useState } from 'react';
import { galleryImages } from '@/data/site-data';
import Lightbox from '@/components/ui/Lightbox';

interface ImagemApi {
  id: string;
  titulo?: string | null;
  url: string;
}

function estaticas() {
  return galleryImages.map((img) => ({ id: String(img.id), src: img.src, alt: img.alt }));
}

/**
 * Galeria publica. Com slug, busca apenas imagens da propria organizacao
 * (congregacao nova nasce com galeria limpa). Sem slug (matriz), usa o
 * default da organizacao ativa mais antiga; se o banco estiver vazio,
 * mantem as imagens estaticas de fallback.
 */
export default function GaleriaGrid({ slug, limit }: { slug?: string; limit?: number }) {
  const [imagens, setImagens] = useState<{ id: string; src: string; alt: string }[] | null>(null);
  const [aberta, setAberta] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (slug) params.set('slug', slug);
    if (limit) params.set('limit', String(limit));
    const qs = params.toString();

    fetch(`/api/public/galeria${qs ? `?${qs}` : ''}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const itens: ImagemApi[] = d?.imagens || [];
        if (itens.length > 0) {
          setImagens(
            itens.map((i) => ({ id: i.id, src: i.url, alt: i.titulo || 'Foto da igreja' }))
          );
        } else if (slug) {
          setImagens([]);
        } else {
          setImagens(estaticas());
        }
      })
      .catch(() => setImagens(slug ? [] : estaticas()));
  }, [slug, limit]);

  if (imagens === null) {
    return <p style={{ color: 'var(--text-muted)' }}>Carregando galeria...</p>;
  }

  return (
    <>
      <div className="gallery-grid">
        {imagens.map((img) => (
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
