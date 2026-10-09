'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import styles from './BannerCarousel.module.css';

interface Banner {
  id: string;
  titulo: string | null;
  imagemUrl: string;
  tipo: string;
  link: string | null;
  ordem: number;
}

const INTERVALO_MS = 6000;

/**
 * Carrossel interativo de banners/flyers no topo do site público.
 * Busca /api/public/banners; sem banners ativos, não renderiza nada.
 */
export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch('/api/public/banners')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setBanners(Array.isArray(d) ? d : []))
      .catch(() => setBanners([]));
  }, []);

  const total = banners.length;

  const proximo = useCallback(() => {
    setIndice((i) => (total > 0 ? (i + 1) % total : 0));
  }, [total]);

  const anterior = useCallback(() => {
    setIndice((i) => (total > 0 ? (i - 1 + total) % total : 0));
  }, [total]);

  useEffect(() => {
    if (total <= 1 || pausado) return;
    timerRef.current = setInterval(proximo, INTERVALO_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, pausado, proximo]);

  if (total === 0) return null;
  if (indice >= total) setIndice(0);

  const slideConteudo = (b: Banner) => {
    const imagem = <img className={styles.image} src={b.imagemUrl} alt={b.titulo || 'Banner'} />;
    return (
      <div className={styles.slide} key={b.id}>
        {b.link ? (
          <Link href={b.link} className={styles.slideLink} aria-label={b.titulo || 'Abrir link do banner'}>
            {imagem}
            {b.titulo && <span className={styles.title}>{b.titulo}</span>}
          </Link>
        ) : (
          <>
            {imagem}
            {b.titulo && <span className={styles.title}>{b.titulo}</span>}
          </>
        )}
      </div>
    );
  };

  return (
    <section
      className={styles.wrap}
      aria-label="Banners e avisos"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <div className={styles.track} style={{ transform: `translateX(-${indice * 100}%)` }}>
        {banners.map(slideConteudo)}
      </div>

      {total > 1 && (
        <>
          <button type="button" className={`${styles.nav} ${styles.navPrev}`} onClick={anterior} aria-label="Banner anterior">
            <ChevronLeft size={20} />
          </button>
          <button type="button" className={`${styles.nav} ${styles.navNext}`} onClick={proximo} aria-label="Próximo banner">
            <ChevronRight size={20} />
          </button>
          <div className={styles.dots}>
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                className={`${styles.dot} ${i === indice ? styles.dotActive : ''}`}
                onClick={() => setIndice(i)}
                aria-label={`Ir para o banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
