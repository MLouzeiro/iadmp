'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Mail, MapPin, Phone, MessageSquare, Send, Building2 } from 'lucide-react';
import ContatoForm from '@/components/public/ContatoForm';
import styles from '../page.module.css';

interface IgrejaConfig {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  configuracoes?: {
    nomeIgreja: string;
    rodapeEndereco: string | null;
    rodapeTelefone: string | null;
    rodapeEmail: string | null;
    rodapeWhatsapp: string | null;
  } | null;
}

export default function IgrejaContatoPage() {
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
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>;
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
          Contato - {igreja.configuracoes?.nomeIgreja || igreja.nome}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Fale conosco. Estamos aqui para ouvir você.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div className={styles.infoCard}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontFamily: 'Playfair Display, serif' }}>
            <Building2 size={24} style={{ color: 'var(--color-primary)' }} />
            Informações
          </h3>
          {igreja.configuracoes?.rodapeEndereco && (
            <div className={styles.infoItem}>
              <MapPin size={20} style={{ color: 'var(--color-primary)' }} />
              <div>
                <strong>Endereço</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{igreja.configuracoes.rodapeEndereco}</p>
              </div>
            </div>
          )}
          {igreja.configuracoes?.rodapeTelefone && (
            <div className={styles.infoItem}>
              <Phone size={20} style={{ color: 'var(--color-primary)' }} />
              <div>
                <strong>Telefone</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{igreja.configuracoes.rodapeTelefone}</p>
              </div>
            </div>
          )}
          {igreja.configuracoes?.rodapeEmail && (
            <div className={styles.infoItem}>
              <Mail size={20} style={{ color: 'var(--color-primary)' }} />
              <div>
                <strong>E-mail</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{igreja.configuracoes.rodapeEmail}</p>
              </div>
            </div>
          )}
          {igreja.configuracoes?.rodapeWhatsapp && (
            <a href={igreja.configuracoes.rodapeWhatsapp} target="_blank" rel="noopener noreferrer" className={styles.infoItemLink}>
              <MessageSquare size={20} style={{ color: 'var(--color-primary)' }} />
              <div>
                <strong>WhatsApp</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Clique para conversar</p>
              </div>
            </a>
          )}
        </div>

        <div className={styles.infoCard}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontFamily: 'Playfair Display, serif' }}>
            <Send size={24} style={{ color: 'var(--color-primary)' }} />
            Envie uma Mensagem
          </h3>
          <ContatoForm slug={slug} />
        </div>
      </div>

      {igreja.configuracoes?.rodapeEndereco && (
        <div className={styles.mapPlaceholder} style={{ aspectRatio: '16/9', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)' }}>
          <MapPin size={32} style={{ marginRight: '0.5rem' }} />
          <span>Mapa de localização - {igreja.configuracoes.rodapeEndereco}</span>
        </div>
      )}
    </>
  );
}