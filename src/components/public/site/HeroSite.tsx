'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
import HeroStats from '@/components/public/HeroStats';

interface HeroConfig {
  exibir?: boolean;
  tipo?: 'IMAGEM' | 'SLIDE' | 'VIDEO';
  imagemUrl?: string;
  videoUrl?: string;
  slides?: { url: string; alt?: string }[];
  sobretitulo?: string;
  titulo?: string;
  subtitulo?: string;
  botaoTexto?: string;
  botaoLink?: string;
}

interface HeroSiteProps {
  slug: string;
  config: HeroConfig | null;
  nomeFallback: string;
  descricaoFallback?: string | null;
}

const SLIDE_INTERVAL = 5000;

export default function HeroSite({ slug, config, nomeFallback, descricaoFallback }: HeroSiteProps) {
  const [slideIdx, setSlideIdx] = useState(0);

  const tipo = config?.tipo || 'IMAGEM';
  const slides = config?.slides || [];
  const imagemUrl = config?.imagemUrl || '/images/iadmp/Slide/image1.jpg';
  const titulo = config?.titulo || nomeFallback;
  const subtitulo = config?.subtitulo || descricaoFallback || 'Uma comunidade de fé, amor e esperança.';
  const sobretitulo = config?.sobretitulo || '';
  const botaoTexto = config?.botaoTexto || 'Conheça nossos eventos';
  const botaoLink = config?.botaoLink || `/igreja/${slug}/eventos`;

  useEffect(() => {
    if (tipo !== 'SLIDE' || slides.length <= 1) return;
    const timer = setInterval(() => {
      setSlideIdx((i) => (i + 1) % slides.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [tipo, slides.length]);

  return (
    <section className="hero" aria-label="Boas-vindas">
      {tipo === 'VIDEO' && config?.videoUrl ? (
        <video className="heroVideo" src={config.videoUrl} autoPlay muted loop playsInline preload="metadata" />
      ) : tipo === 'SLIDE' && slides.length > 0 ? (
        <div className="heroSlides" aria-hidden>
          {slides.map((s, i) => (
            <div
              key={s.url + i}
              className={`heroSlide ${i === slideIdx ? 'heroSlideActive' : ''}`}
              style={{ backgroundImage: `url(${s.url})` }}
            />
          ))}
        </div>
      ) : (
        <div className="heroBg" style={{ backgroundImage: `url(${imagemUrl})` }} />
      )}
      <div className="heroOverlay" />
      <div className="heroContent">
        {sobretitulo && <div className="heroEyebrow">{sobretitulo}</div>}
        <h2 className="heroTitle">{titulo}</h2>
        <p className="heroSub">{subtitulo}</p>
        <Link href={botaoLink} className="heroBtn">
          <Calendar size={18} /> {botaoTexto} <ArrowRight size={16} />
        </Link>
        <HeroStats slug={slug} />
      </div>
    </section>
  );
}
