'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Images, Image, Grid, Search } from 'lucide-react';
import GaleriaGrid from '@/components/public/GaleriaGrid';
import styles from '../page.module.css';

export default function IgrejaGaleriaPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [igrejaNome, setIgrejaNome] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/church-info?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.organizacao) setIgrejaNome(d.organizacao.nome);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando galeria...</div>;
  }

  return (
    <>
      <section className={styles.sectionHeader} style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', color: 'var(--text-primary)' }}>
          Galeria - {igrejaNome}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Momentos especiais da nossa caminhada juntos.
        </p>
      </section>

      <GaleriaGrid slug={slug} limit={20} />
    </>
  );
}