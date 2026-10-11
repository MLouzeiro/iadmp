'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BookOpen, Play, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import PregacoesList from '@/components/public/PregacoesList';
import styles from '../page.module.css';

export default function IgrejaPregacoesPage() {
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
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando pregações...</div>;
  }

  return (
    <>
      <section className={styles.sectionHeader} style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', color: 'var(--text-primary)' }}>
          Pregações - {igrejaNome}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Mensagens que edificam e transformam vidas.
        </p>
      </section>

      <PregacoesList slug={slug} limit={12} />
    </>
  );
}