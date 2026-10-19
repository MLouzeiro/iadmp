'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Save, Eye, ArrowLeft, Layout, Type, Image, Users, Calendar, BookOpen, MessageSquare, Zap, Heart, Palette, PlayCircle, Film, ImageIcon, Quote, Plus, Trash2, Building2 } from 'lucide-react';
import Link from 'next/link';
import PageHead from '@/components/ui/PageHead';
import Button from '@/components/ui/Button';
import UploadField from '@/components/ui/UploadField';
import { useToast } from '@/components/ui/Toast';
import { useOrganizacoes } from '@/hooks/useOrganizacoes';
import { LISTA_PALETAS } from '@/lib/site-palettes';
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
  secaoPilares?: any;
  secaoPalavraDia?: any;
  secaoMinisterios?: any;
  secaoRodapeInfo?: any;
  conteudo?: any;
}

const secoesConfig = [
  { key: 'secaoHero', label: 'Hero / Banner Principal', icon: Layout, desc: 'Tipo (imagem, slide ou vídeo), textos e botão da seção principal' },
  { key: 'secaoPalavraDia', label: 'Palavra do Dia', icon: Quote, desc: 'Botão "Palavra do Dia" nos pilares: versículo com reflexão (conteúdo gerenciado em Comunicação → Versículos)' },
  { key: 'secaoSobre', label: 'Sobre a Igreja', icon: Heart, desc: 'Texto descritivo da seção "Sobre nós"' },
  { key: 'secaoPilares', label: 'Pilares Institucionais', icon: BookOpen, desc: 'Faixa com os 4 valores: Palavra de Deus, Palavra do Dia, Comunhão, Adoração — clique abre modal com detalhes e versículo do tema' },
  { key: 'secaoEventos', label: 'Eventos & Avisos', icon: Calendar, desc: 'Grade de próximos eventos + painel lateral de avisos' },
  { key: 'secaoMinisterios', label: 'Ministérios', icon: Users, desc: 'Seção de ministérios com tiles clicáveis' },
  { key: 'secaoRodapeInfo', label: 'Rodapé de Informações', icon: MessageSquare, desc: 'Localização, horários dos cultos e redes sociais' },
  { key: 'secaoLideranca', label: 'Liderança', icon: Users, desc: 'Configuração de exibição da seção de liderança' },
  { key: 'secaoGaleria', label: 'Galeria', icon: Image, desc: 'Configuração de exibição da galeria de fotos' },
  { key: 'secaoContato', label: 'Contato', icon: MessageSquare, desc: 'Configuração de exibição do formulário de contato' },
  { key: 'secaoPregacoes', label: 'Pregações', icon: BookOpen, desc: 'Configuração de exibição das pregações recentes' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.85rem',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
};

function HeroEditor({ valor, onChange, organizacaoId }: { valor: any; onChange: (v: any) => void; organizacaoId: string }) {
  const current = valor || {};
  const tipo = current.tipo || 'IMAGEM';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Tipo de fundo</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {([
            { v: 'IMAGEM', label: 'Imagem', icon: ImageIcon },
            { v: 'SLIDE', label: 'Slide', icon: Film },
            { v: 'VIDEO', label: 'Vídeo', icon: PlayCircle },
          ] as const).map(({ v, label, icon: Icon }) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ ...current, tipo: v })}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.75rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: `2px solid ${tipo === v ? 'var(--color-primary)' : 'var(--border-color)'}`,
                background: tipo === v ? 'var(--gradient-gold-soft)' : 'var(--bg-input)',
                color: tipo === v ? 'var(--color-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <Icon size={20} /> {label}
            </button>
          ))}
        </div>
      </div>

      {tipo === 'IMAGEM' && (
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>URL da imagem de fundo</label>
          <input type="text" value={current.imagemUrl || ''} onChange={(e) => onChange({ ...current, imagemUrl: e.target.value })} style={inputStyle} placeholder="/images/iadmp/Slide/image1.jpg" />
          <div style={{ marginTop: '0.5rem' }}>
            <UploadField
              organizacaoId={organizacaoId}
              value={current.imagemUrl || ''}
              onChange={(url) => onChange({ ...current, imagemUrl: url })}
              pasta="site"
              entityTipo="PaginaPublica"
              label="Enviar imagem de fundo"
            />
          </div>
        </div>
      )}

      {tipo === 'SLIDE' && (
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Slides (uma URL por linha)</label>
          <textarea
            rows={4}
            value={(current.slides || []).map((s: any) => s.url || s).join('\n')}
            onChange={(e) => {
              const urls = e.target.value.split('\n').map((l) => l.trim()).filter(Boolean);
              onChange({ ...current, slides: urls.map((url) => ({ url })) });
            }}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }}
            placeholder="/images/slide1.jpg&#10;/images/slide2.jpg"
          />
          <div style={{ marginTop: '0.5rem' }}>
            <UploadField
              organizacaoId={organizacaoId}
              value=""
              onChange={(url) => {
                const atual: { url: string }[] = (current.slides || []).map((s: any) => (typeof s === 'string' ? { url: s } : s));
                onChange({ ...current, slides: [...atual, { url }] });
              }}
              pasta="site"
              entityTipo="PaginaPublica"
              label="Adicionar slide (enviar imagem)"
            />
          </div>
        </div>
      )}

      {tipo === 'VIDEO' && (
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>URL do vídeo (mp4 local recomendado p/ autoplay)</label>
          <input type="text" value={current.videoUrl || ''} onChange={(e) => onChange({ ...current, videoUrl: e.target.value })} style={inputStyle} placeholder="/videos/hero.mp4" />
        </div>
      )}

      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Sobretítulo (eyebrow)</label>
        <input type="text" value={current.sobretitulo || ''} onChange={(e) => onChange({ ...current, sobretitulo: e.target.value })} style={inputStyle} placeholder="IADMP Congregação Centro" />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Título principal</label>
        <input type="text" value={current.titulo || ''} onChange={(e) => onChange({ ...current, titulo: e.target.value })} style={inputStyle} placeholder="Igreja Assembleia de Deus" />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Subtítulo</label>
        <textarea rows={2} value={current.subtitulo || ''} onChange={(e) => onChange({ ...current, subtitulo: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Ministério da Promessa" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Texto do botão</label>
          <input type="text" value={current.botaoTexto || ''} onChange={(e) => onChange({ ...current, botaoTexto: e.target.value })} style={inputStyle} placeholder="Conheça nossos eventos" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Link do botão</label>
          <input type="text" value={current.botaoLink || ''} onChange={(e) => onChange({ ...current, botaoLink: e.target.value })} style={inputStyle} placeholder="/igreja/slug/eventos" />
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={current.exibir ?? true} onChange={() => onChange({ ...current, exibir: !(current.exibir ?? true) })} style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Exibir seção Hero</span>
      </label>
    </div>
  );
}

function PilaresEditor({ valor, onChange }: { valor: any; onChange: (v: any) => void }) {
  const current = valor || {};
  const itens: { titulo: string; descricao: string; detalhes?: string }[] = current.itens || [];

  const updateItem = (idx: number, patch: Partial<{ titulo: string; descricao: string; detalhes: string }>) => {
    const next = itens.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange({ ...current, itens: next });
  };

  const addItem = () => {
    onChange({ ...current, itens: [...itens, { titulo: '', descricao: '', detalhes: '' }] });
  };

  const removeItem = (idx: number) => {
    onChange({ ...current, itens: itens.filter((_, i) => i !== idx) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={current.exibir ?? true}
          onChange={() => onChange({ ...current, exibir: !(current.exibir ?? true) })}
          style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
        />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Exibir seção Pilares</span>
      </label>

      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Deixe a lista vazia para usar o conteúdo padrão (Palavra de Deus, Palavra do Dia, Comunhão, Adoração).
      </p>

      {itens.map((item, idx) => (
        <div
          key={idx}
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pilar {idx + 1}</strong>
            <button
              type="button"
              onClick={() => removeItem(idx)}
              style={{ background: 'none', border: 'none', color: '#C41E1E', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
            >
              <Trash2 size={14} /> Remover
            </button>
          </div>
          <input
            type="text"
            value={item.titulo}
            onChange={(e) => updateItem(idx, { titulo: e.target.value })}
            placeholder="Título (ex.: Palavra de Deus)"
            style={inputStyle}
          />
          <input
            type="text"
            value={item.descricao}
            onChange={(e) => updateItem(idx, { descricao: e.target.value })}
            placeholder="Descrição curta (ex.: Estudo, ensino e vida com propósito.)"
            style={inputStyle}
          />
          <textarea
            rows={3}
            value={item.detalhes || ''}
            onChange={(e) => updateItem(idx, { detalhes: e.target.value })}
            placeholder="Detalhes exibidos no modal ao clicar no pilar"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
      ))}

      <Button type="button" variant="secondary" onClick={addItem} icon={<Plus size={14} />}>
        Adicionar pilar
      </Button>
    </div>
  );
}

function RodapeInfoEditor({ valor, onChange }: { valor: any; onChange: (v: any) => void }) {
  const current = valor || {};
  const horarios: { dia: string; horario: string }[] = current.horariosCulto || [];

  const setField = (campo: string, v: string) => onChange({ ...current, [campo]: v });

  const updateHorario = (idx: number, patch: Partial<{ dia: string; horario: string }>) => {
    const next = horarios.map((h, i) => (i === idx ? { ...h, ...patch } : h));
    onChange({ ...current, horariosCulto: next });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={current.exibir ?? true}
          onChange={() => onChange({ ...current, exibir: !(current.exibir ?? true) })}
          style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
        />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Exibir seção Rodapé de Informações</span>
      </label>

      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Endereço / Localização</label>
        <input type="text" value={current.endereco || ''} onChange={(e) => setField('endereco', e.target.value)} style={inputStyle} placeholder="Rua, número — Bairro, Cidade/UF" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Telefone</label>
          <input type="tel" value={current.telefone || ''} onChange={(e) => setField('telefone', e.target.value)} style={inputStyle} placeholder="+55 98 98803-5646" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>WhatsApp (só números)</label>
          <input type="tel" value={current.whatsapp || ''} onChange={(e) => setField('whatsapp', e.target.value)} style={inputStyle} placeholder="5598988035646" />
        </div>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>E-mail</label>
        <input type="email" value={current.email || ''} onChange={(e) => setField('email', e.target.value)} style={inputStyle} placeholder="contato@igreja.com" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Instagram (URL)</label>
          <input type="url" value={current.instagram || ''} onChange={(e) => setField('instagram', e.target.value)} style={inputStyle} placeholder="https://instagram.com/..." />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Facebook (URL)</label>
          <input type="url" value={current.facebook || ''} onChange={(e) => setField('facebook', e.target.value)} style={inputStyle} placeholder="https://facebook.com/..." />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>YouTube (URL)</label>
          <input type="url" value={current.youtube || ''} onChange={(e) => setField('youtube', e.target.value)} style={inputStyle} placeholder="https://youtube.com/..." />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Horários dos Cultos</label>
        {horarios.map((h, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
            <input type="text" value={h.dia} onChange={(e) => updateHorario(idx, { dia: e.target.value })} style={inputStyle} placeholder="Domingo" />
            <input type="text" value={h.horario} onChange={(e) => updateHorario(idx, { horario: e.target.value })} style={inputStyle} placeholder="09h00 e 18h00 — Culto de Celebração" />
            <button
              type="button"
              onClick={() => onChange({ ...current, horariosCulto: horarios.filter((_, i) => i !== idx) })}
              style={{ background: 'none', border: 'none', color: '#C41E1E', cursor: 'pointer', display: 'flex' }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => onChange({ ...current, horariosCulto: [...horarios, { dia: '', horario: '' }] })}>
          Adicionar horário
        </Button>
      </div>
    </div>
  );
}

function SecaoEditor({ secao, valor, onChange, organizacaoId }: { secao: (typeof secoesConfig)[number]; valor: any; onChange: (v: any) => void; organizacaoId: string }) {
  const [expanded, setExpanded] = useState(secao.key === 'secaoHero');

  const defaultValues: Record<string, any> = {
    secaoHero: { exibir: true, tipo: 'IMAGEM', titulo: '', subtitulo: '', sobretitulo: '', botaoTexto: 'Conheça nossos eventos' },
    secaoPalavraDia: { exibir: true },
    secaoSobre: { exibir: true, titulo: 'Sobre Nós', texto: 'Somos uma igreja comprometida com o Evangelho.' },
    secaoPilares: { exibir: true, itens: [] },
    secaoEventos: { exibir: true },
    secaoMinisterios: { exibir: true },
    secaoRodapeInfo: { exibir: true },
    secaoLideranca: { exibir: true },
    secaoGaleria: { exibir: true },
    secaoContato: { exibir: true },
    secaoPregacoes: { exibir: true },
  };

  const current = valor || defaultValues[secao.key] || {};

  const handleToggle = (campo: string) => {
    onChange({ ...current, [campo]: !current[campo] });
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
        <span style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </button>

      {expanded && (
        <div className={styles.sectionContent} style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
          {secao.key === 'secaoHero' ? (
            <HeroEditor valor={current} onChange={onChange} organizacaoId={organizacaoId} />
          ) : secao.key === 'secaoPilares' ? (
            <PilaresEditor valor={current} onChange={onChange} />
          ) : secao.key === 'secaoRodapeInfo' ? (
            <RodapeInfoEditor valor={current} onChange={onChange} />
          ) : (
            Object.entries(current).map(([campo, value]) => {
              if (typeof value === 'boolean') {
                return (
                  <label key={campo} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={value} onChange={() => handleToggle(campo)} style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {campo === 'exibir' ? 'Exibir seção' : campo}
                    </span>
                  </label>
                );
              }
              return (
                <div key={campo} style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>{campo}</label>
                  <input type="text" value={typeof value === 'string' ? value : ''} onChange={(e) => onChange({ ...current, [campo]: e.target.value })} style={inputStyle} />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function PaletaSelector({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <div className={styles.sectionCard} style={{ marginBottom: '1.5rem' }}>
      <div className={styles.sectionHeader} style={{ cursor: 'default' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-gold-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Palette size={20} style={{ color: 'var(--color-primary)' }} />
          </span>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Paleta do Site Público</h4>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Escolha a paleta de cores do site desta congregação (12 meses + padrão + ouro)
            </p>
          </div>
        </div>
      </div>
      <div style={{ padding: '1rem 0 0', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem' }}>
          {LISTA_PALETAS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: `2px solid ${valor === p.id ? 'var(--color-primary)' : 'var(--border-color)'}`,
                background: valor === p.id ? 'var(--gradient-gold-soft)' : 'var(--bg-input)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', gap: '2px' }}>
                <span style={{ width: 14, height: 14, borderRadius: '3px', background: p.primaria }} />
                <span style={{ width: 14, height: 14, borderRadius: '3px', background: p.navy }} />
                <span style={{ width: 14, height: 14, borderRadius: '3px', background: p.fundoClaro, border: '1px solid var(--border-color)' }} />
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: valor === p.id ? 'var(--color-primary)' : 'var(--text-secondary)' }}>
                {p.nome}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SitePublicoClientProps {
  slug: string;
  organizacaoId: string;
  urlPublica: string;
}

export default function SitePublicoClient({ slug: slugProp, organizacaoId: orgIdProp, urlPublica: urlProp }: SitePublicoClientProps) {
  const { toast } = useToast();
  const { data: session } = useSession();
  const { orgs, loading: orgsLoading, multiOrg, orgAtualId } = useOrganizacoes();
  const [pagina, setPagina] = useState<PaginaPublica | null>(null);
  const [paletaSite, setPaletaSite] = useState('PADRAO');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgEscolhidaId, setOrgEscolhidaId] = useState('');

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  const organizacaoId = orgIdProp || orgEscolhidaId || orgAtualId || (orgs.length === 1 ? orgs[0].id : '');
  const orgSelecionada = orgs.find((o) => o.id === organizacaoId);
  const slug = slugProp || orgSelecionada?.slug || '';
  const urlPublica = urlProp || (slug ? `/igreja/${slug}` : '');

  const fetchPagina = useCallback(async () => {
    if (!organizacaoId) {
      setLoading(false);
      return;
    }
    try {
      const [pagRes, cfgRes] = await Promise.all([
        fetch(`/api/pagina-publica?organizacaoId=${organizacaoId}`),
        fetch(`/api/configuracoes?organizacaoId=${organizacaoId}`),
      ]);
      if (pagRes.ok) {
        const data = await pagRes.json();
        if (cfgRes.ok) {
          const cfg = await cfgRes.json();
          const info = data?.secaoRodapeInfo || {};
          if (info.endereco === undefined && cfg?.rodapeEndereco) info.endereco = cfg.rodapeEndereco;
          if (info.telefone === undefined && cfg?.rodapeTelefone) info.telefone = cfg.rodapeTelefone;
          if (info.whatsapp === undefined && cfg?.rodapeWhatsapp) info.whatsapp = cfg.rodapeWhatsapp;
          if (info.email === undefined && cfg?.rodapeEmail) info.email = cfg.rodapeEmail;
          if (info.instagram === undefined && cfg?.rodapeInstagram) info.instagram = cfg.rodapeInstagram;
          if (info.facebook === undefined && cfg?.rodapeFacebook) info.facebook = cfg.rodapeFacebook;
          if (info.youtube === undefined && cfg?.rodapeYoutube) info.youtube = cfg.rodapeYoutube;
          if (info.horariosCulto === undefined) info.horariosCulto = [];
          data.secaoRodapeInfo = info;
        }
        setPagina(data);
      }
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        if (cfg?.paletaSite) setPaletaSite(cfg.paletaSite);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [organizacaoId]);

  useEffect(() => {
    if (orgsLoading) return;
    fetchPagina();
  }, [fetchPagina, orgsLoading]);

  const handleSecaoChange = (secaoKey: string, value: any) => {
    setPagina(prev => prev ? { ...prev, [secaoKey]: value } : null);
  };

  const salvar = async () => {
    if (!organizacaoId) return;
    setSaving(true);
    try {
      const pagPayload: Record<string, unknown> = { organizacaoId };
      if (pagina) {
        pagPayload.secaoHero = pagina.secaoHero;
        pagPayload.secaoPalavraDia = pagina.secaoPalavraDia;
        pagPayload.secaoSobre = pagina.secaoSobre;
        pagPayload.secaoEventos = pagina.secaoEventos;
        pagPayload.secaoLideranca = pagina.secaoLideranca;
        pagPayload.secaoGaleria = pagina.secaoGaleria;
        pagPayload.secaoContato = pagina.secaoContato;
        pagPayload.secaoPregacoes = pagina.secaoPregacoes;
        pagPayload.secaoPilares = pagina.secaoPilares;
        pagPayload.secaoMinisterios = pagina.secaoMinisterios;
        pagPayload.secaoRodapeInfo = pagina.secaoRodapeInfo;
        pagPayload.conteudo = pagina.conteudo;
      }

      const ri = pagina?.secaoRodapeInfo || {};
      const cfgPayload: Record<string, unknown> = {
        organizacaoId,
        paletaSite,
        rodapeEndereco: ri.endereco ?? '',
        rodapeTelefone: ri.telefone ?? '',
        rodapeWhatsapp: ri.whatsapp ?? '',
        rodapeEmail: ri.email ?? '',
        rodapeInstagram: ri.instagram ?? '',
        rodapeFacebook: ri.facebook ?? '',
        rodapeYoutube: ri.youtube ?? '',
      };

      const [pagRes, cfgRes] = await Promise.all([
        fetch('/api/pagina-publica', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pagPayload),
        }),
        fetch('/api/configuracoes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cfgPayload),
        }),
      ]);

      if (pagRes.ok && cfgRes.ok) {
        toast('Site público salvo com sucesso!', 'ok');
        fetchPagina();
      } else {
        const d = await pagRes.json().catch(() => ({}));
        toast(d.error || 'Erro ao salvar', 'err');
      }
    } catch (e) {
      toast('Erro de conexão', 'err');
    } finally {
      setSaving(false);
    }
  };

  if (loading || orgsLoading) {
    return <div className={styles.loadingState}>Carregando configurações do site...</div>;
  }

  if (!organizacaoId) {
    return (
      <div className={styles.loadingState}>
        {multiOrg
          ? 'Carregando organizações...'
          : 'Nenhuma igreja vinculada a este usuário. Contate o SUPER_ADMIN.'}
      </div>
    );
  }

  return (
    <div>
      <PageHead
        title="Editor do Site Público"
        subtitle={`${orgSelecionada?.nome || slug} · ${urlPublica}`}
        actions={
          <>
            {urlPublica && <Link href={urlPublica} target="_blank"><Button variant="secondary" icon={<Eye size={16} />}>Visualizar</Button></Link>}
            <Button onClick={salvar} disabled={saving || !organizacaoId}><Save size={16} /> {saving ? 'Salvando...' : 'Salvar Alterações'}</Button>
          </>
        }
      />

      {multiOrg && isSuperAdmin && (
        <div className={styles.sectionCard} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem' }}>
          <Building2 size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Igreja:</label>
          <select
            value={organizacaoId}
            onChange={(e) => setOrgEscolhidaId(e.target.value)}
            style={{
              flex: 1,
              padding: '0.45rem 0.65rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          >
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.nome}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '800px' }}>
        <PaletaSelector valor={paletaSite} onChange={setPaletaSite} />

        {secoesConfig.map((secao) => (
          <SecaoEditor
            key={secao.key}
            secao={secao}
            valor={pagina?.[secao.key as keyof PaginaPublica]}
            onChange={(v) => handleSecaoChange(secao.key, v)}
            organizacaoId={organizacaoId}
          />
        ))}

        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={20} style={{ color: 'var(--color-primary)' }} /> Preview Rápido
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={16} /> <strong>URL:</strong> <code style={{ background: 'var(--bg-input)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>{urlPublica}</code>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Palette size={16} /> Paleta: <strong>{LISTA_PALETAS.find((p) => p.id === paletaSite)?.nome || paletaSite}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layout size={16} /> Hero: {pagina?.secaoHero?.exibir === false ? 'Oculto' : (pagina?.secaoHero?.titulo || 'Padrão')} · {pagina?.secaoHero?.tipo || 'IMAGEM'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Quote size={16} /> Palavra do Dia (nos pilares): {pagina?.secaoPalavraDia?.exibir === false ? 'Oculto' : 'Exibir'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={16} /> Pilares: {pagina?.secaoPilares?.exibir === false ? 'Oculto' : `Exibir${pagina?.secaoPilares?.itens?.length ? ` (${pagina.secaoPilares.itens.length} itens)` : ' (padrão)'}`}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} /> Eventos: {pagina?.secaoEventos?.exibir === false ? 'Oculto' : 'Exibir'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} /> Ministérios: {pagina?.secaoMinisterios?.exibir === false ? 'Oculto' : 'Exibir'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={16} /> Rodapé Info: {pagina?.secaoRodapeInfo?.exibir === false ? 'Oculto' : 'Exibir'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
