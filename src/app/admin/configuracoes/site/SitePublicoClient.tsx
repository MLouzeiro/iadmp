'use client';

import { useEffect, useState, useCallback } from 'react';
import { Save, Eye, ArrowLeft, Layout, Type, Image, Users, Calendar, BookOpen, MessageSquare, Zap, Heart } from 'lucide-react';
import Link from 'next/link';
import PageHead from '@/components/ui/PageHead';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import styles from '@/components/ui/form.module.css';

interface PaginaPublica {
  id?: string;
  organizacaoId: string;
  secaoHero?: any;
  secaoSobre?: any;
  secaoEventos?: any;
  secaoLideranca?: any;
  secaoGaleria?: any;
  secaoContato?: any;
  secaoPregacoes?: any;
  conteudo?: any;
}

const secoesConfig = [
  { key: 'secaoHero', label: 'Hero / Banner Principal', icon: Layout, desc: 'Título, subtítulo e botões da seção principal' },
  { key: 'secaoSobre', label: 'Sobre a Igreja', icon: Heart, desc: 'Texto descritivo da seção "Sobre nós"' },
  { key: 'secaoEventos', label: 'Eventos', icon: Calendar, desc: 'Configuração de exibição da seção de eventos' },
  { key: 'secaoLideranca', label: 'Liderança', icon: Users, desc: 'Configuração de exibição da seção de liderança' },
  { key: 'secaoGaleria', label: 'Galeria', icon: Image, desc: 'Configuração de exibição da galeria de fotos' },
  { key: 'secaoContato', label: 'Contato', icon: MessageSquare, desc: 'Configuração de exibição do formulário de contato' },
  { key: 'secaoPregacoes', label: 'Pregações', icon: BookOpen, desc: 'Configuração de exibição das pregações recentes' },
];

function SecaoEditor({ secao, valor, onChange }: { secao: typeof secoesConfig[0]; valor: any; onChange: (v: any) => void }) {
  const [expanded, setExpanded] = useState(true);

  const defaultValues: Record<string, any> = {
    secaoHero: { titulo: 'Bem-vindos à nossa Igreja', subtitulo: 'Uma comunidade de fé, amor e esperança', botaoPrimario: 'Conheça mais', botaoSecundario: 'Eventos' },
    secaoSobre: { titulo: 'Sobre Nós', texto: 'Somos uma igreja comprometida com o Evangelho.' },
    secaoEventos: { titulo: 'Próximos Eventos', exibir: true },
    secaoLideranca: { titulo: 'Nossa Liderança', exibir: true },
    secaoGaleria: { titulo: 'Galeria', exibir: true },
    secaoContato: { titulo: 'Contato', exibir: true },
    secaoPregacoes: { titulo: 'Pregações Recentes', exibir: true },
  };

  const current = valor || defaultValues[secao.key] || {};

  const handleToggle = (campo: string) => {
    if (typeof current[campo] === 'boolean') {
      onChange({ ...current, [campo]: !current[campo] });
    }
  };

  const handleTextChange = (campo: string, value: string) => {
    onChange({ ...current, [campo]: value });
  };

  return (
    <div className={styles.sectionCard} style={{ marginBottom: '1.5rem' }}>
      <button type="button" className={styles.sectionHeader} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-gold-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <secao.icon size={20} style={{ color: 'var(--color-primary)' }} />
          </span>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{secao.label}</h4>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{secao.desc}</p>
          </div>
        </div>
        <span style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {expanded && (
        <div className={styles.sectionContent} style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
          {Object.entries(current).map(([campo, value]) => {
            if (typeof value === 'boolean') {
              return (
                <label key={campo} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => handleToggle(campo)}
                    style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {campo.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                </label>
              );
            }
            return (
              <div key={campo} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'capitalize' }}>
                  {campo.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
                <input
                  type="text"
                  value={value || ''}
                  onChange={(e) => handleTextChange(campo, e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  placeholder={defaultValues[secao.key]?.[campo] || ''}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface SitePublicoClientProps {
  slug: string;
  organizacaoId: string;
  urlPublica: string;
}

export default function SitePublicoClient({ slug, organizacaoId, urlPublica }: SitePublicoClientProps) {
  const { toast } = useToast();
  const [pagina, setPagina] = useState<PaginaPublica | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPagina = useCallback(async () => {
    if (!organizacaoId) return;
    try {
      const res = await fetch(`/api/pagina-publica?organizacaoId=${organizacaoId}`);
      if (res.ok) {
        const data = await res.json();
        setPagina(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [organizacaoId]);

  useEffect(() => { fetchPagina(); }, [fetchPagina]);

  const handleSecaoChange = (secaoKey: string, value: any) => {
    setPagina(prev => prev ? { ...prev, [secaoKey]: value } : null);
  };

  const salvar = async () => {
    if (!pagina || !organizacaoId) return;
    setSaving(true);
    try {
      const payload = {
        organizacaoId,
        secaoHero: pagina.secaoHero,
        secaoSobre: pagina.secaoSobre,
        secaoEventos: pagina.secaoEventos,
        secaoLideranca: pagina.secaoLideranca,
        secaoGaleria: pagina.secaoGaleria,
        secaoContato: pagina.secaoContato,
        secaoPregacoes: pagina.secaoPregacoes,
        conteudo: pagina.conteudo,
      };
      const res = await fetch('/api/pagina-publica', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast('Site público salvo com sucesso!', 'ok');
        fetchPagina();
      } else {
        const d = await res.json().catch(() => ({}));
        toast(d.error || 'Erro ao salvar', 'err');
      }
    } catch (e) {
      toast('Erro de conexão', 'err');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loadingState}>Carregando configurações do site...</div>;
  }

  if (!pagina) {
    return (
      <div>
        <PageHead title="Editor do Site Público" subtitle={`Organização: ${slug}`} actions={
          <Link href={urlPublica} target="_blank"><Button variant="secondary" icon={<Eye size={16} />}>Ver Site</Button></Link>
        } />
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Nenhuma configuração encontrada. Clique em "Salvar" para criar a configuração inicial.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHead
        title="Editor do Site Público"
        subtitle={`Organização: ${slug} · ${urlPublica}`}
        actions={
          <>
            <Link href={urlPublica} target="_blank"><Button variant="secondary" icon={<Eye size={16} />}>Visualizar</Button></Link>
            <Button icon={<Save size={16} />} onClick={salvar} disabled={saving} loading={saving}>Salvar Alterações</Button>
          </>
        }
      />

      <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '800px' }}>
        {secoesConfig.map((secao) => (
          <SecaoEditor
            key={secao.key}
            secao={secao}
            valor={pagina[secao.key as keyof PaginaPublica]}
            onChange={(v) => handleSecaoChange(secao.key, v)}
          />
        ))}

        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={20} style={{ color: 'var(--color-primary)' }} />
            Preview Rápido
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={16} /> <strong>URL Pública:</strong> <code style={{ background: 'var(--bg-input)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>{urlPublica}</code>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layout size={16} /> Hero: {pagina.secaoHero?.titulo || 'Não configurado'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Heart size={16} /> Sobre: {pagina.secaoSobre?.titulo || 'Não configurado'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} /> Eventos: {pagina.secaoEventos?.exibir ? 'Exibir' : 'Oculto'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} /> Liderança: {pagina.secaoLideranca?.exibir ? 'Exibir' : 'Oculto'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Image size={16} /> Galeria: {pagina.secaoGaleria?.exibir ? 'Exibir' : 'Oculto'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={16} /> Contato: {pagina.secaoContato?.exibir ? 'Exibir' : 'Oculto'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={16} /> Pregações: {pagina.secaoPregacoes?.exibir ? 'Exibir' : 'Oculto'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}