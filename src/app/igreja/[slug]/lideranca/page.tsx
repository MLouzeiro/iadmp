'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { UserCheck, Building2 } from 'lucide-react';
import LiderancaList from '@/components/public/LiderancaList';
import styles from '../page.module.css';

interface IgrejaConfig {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  configuracoes?: {
    nomeIgreja: string;
    logoUrl: string | null;
    corPrincipal: string;
  } | null;
}

export default function IgrejaLiderancaPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [igreja, setIgreja] = useState<IgrejaConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/church-info?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.organizacao) {
          setIgreja({
            id: d.organizacao.id,
            nome: d.organizacao.nome,
            slug: d.organizacao.slug,
            descricao: d.organizacao.descricao,
            configuracoes: d.configuracoes,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando liderança...</div>;
  }

  if (!igreja) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h1 style={{ color: 'var(--text-primary)' }}>Igreja não encontrada</h1>
      </div>
    );
  }

  return (
    <>
      <section className={styles.sectionHeader} style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', color: 'var(--text-primary)' }}>
          Liderança - {igreja.configuracoes?.nomeIgreja || igreja.nome}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Conheça os servos que guiam nossa comunidade com amor e dedicação.
        </p>
      </section>

      <LiderancaList slug={slug} />
    </>
  );
}