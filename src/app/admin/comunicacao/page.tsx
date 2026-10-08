'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SectionHead from '@/components/ui/SectionHead';
import { Radio, Mic, Plus, ExternalLink, ArrowRight } from 'lucide-react';

interface DashboardData {
  totalPregacoes: number;
  publicadas: number;
  rascunhos: number;
  arquivadas: number;
  canaisAtivos: number;
  ultimaPregacao: { id: string; titulo: string; data: string; pregadorNome?: string; slug: string } | null;
}

const TIPOS_CANAL: Record<string, { label: string; emoji: string }> = {
  youtube: { label: 'YouTube', emoji: '▶️' },
  instagram: { label: 'Instagram', emoji: '◎' },
  facebook: { label: 'Facebook', emoji: '📘' },
  tiktok: { label: 'TikTok', emoji: '🎵' },
  whatsapp: { label: 'WhatsApp', emoji: '💬' },
  site: { label: 'Site', emoji: '🌐' },
  telegram: { label: 'Telegram', emoji: '✈️' },
};

const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');

export default function ComunicacaoPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [canais, setCanais] = useState<{ id: string; tipo: string; nome: string; url: string }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/comunicacao/dashboard').then(r => r.json()),
      fetch('/api/comunicacao/canais').then(r => r.json()),
    ]).then(([dashboard, canaisData]) => {
      setData(dashboard);
      setCanais(canaisData.canais || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando...</div>;

  return (
    <div>
      <SectionHead icon={<Radio size={24} />} title="Comunicação" subtitle="Canais oficiais e pregações da igreja" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Pregações', value: data?.totalPregacoes ?? 0, color: 'var(--color-secondary)' },
          { label: 'Publicadas', value: data?.publicadas ?? 0, color: '#4caf50' },
          { label: 'Rascunhos', value: data?.rascunhos ?? 0, color: '#ff9800' },
          { label: 'Canais Ativos', value: data?.canaisAtivos ?? 0, color: 'var(--color-primary)' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: '0.25rem' }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {data?.ultimaPregacao && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Última Pregação Publicada</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{data.ultimaPregacao.titulo}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {formatDate(data.ultimaPregacao.data)} {data.ultimaPregacao.pregadorNome && `— ${data.ultimaPregacao.pregadorNome}`}
              </div>
            </div>
            <Link href={`/admin/comunicacao/pregacoes/${data.ultimaPregacao.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
              Ver <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Pregações</h3>
            <Link href="/admin/comunicacao/pregacoes/nova" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'var(--gradient-gold)', color: '#000', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}>
              <Plus size={14} /> Nova
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link href="/admin/comunicacao/pregacoes" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', transition: 'var(--transition)' }}>
              <Mic size={18} /> Todas as pregações <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
            </Link>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Canais Oficiais</h3>
            <Link href="/admin/comunicacao/canais" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'var(--gradient-gold)', color: '#000', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}>
              <Plus size={14} /> Novo
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {canais.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum canal cadastrado</div>
            ) : (
              canais.slice(0, 5).map(c => (
                <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', transition: 'var(--transition)' }}>
                  <span>{TIPOS_CANAL[c.tipo]?.emoji || '🔗'}</span>
                  {c.nome}
                  <ExternalLink size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
