'use client';

import { useEffect, useState, useCallback } from 'react';
import { Save, RotateCcw, Palette, Eye } from 'lucide-react';
import { palettes, defaultColors, type ThemeColors } from '@/lib/theme-palettes';

interface Config {
  id?: string;
  nomeIgreja: string;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  faviconUrl: string | null;
  corPrincipal: string;
  corSecundaria: string;
  corDestaque: string;
  corFundo: string;
  corFundoClaro: string;
  corSuperficie: string;
  corTexto: string;
  corTextoSecundario: string;
  corBorda: string;
  tema: string;
}

const colorFields: { key: keyof ThemeColors; label: string }[] = [
  { key: 'corPrincipal', label: 'Principal' },
  { key: 'corSecundaria', label: 'Secundaria' },
  { key: 'corDestaque', label: 'Destaque' },
  { key: 'corFundo', label: 'Fundo' },
  { key: 'corFundoClaro', label: 'Fundo Claro' },
  { key: 'corSuperficie', label: 'Superficie' },
  { key: 'corTexto', label: 'Texto' },
  { key: 'corTextoSecundario', label: 'Texto Secundario' },
];

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const hexValue = value.startsWith('#') ? value : '#000000';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minWidth: '120px' }}>{label}</label>
      <div style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--border-color)', flexShrink: 0 }}>
        <input
          type="color"
          value={hexValue}
          onChange={(e) => onChange(e.target.value)}
          style={{ position: 'absolute', inset: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', cursor: 'pointer', border: 'none', padding: 0 }}
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '120px',
          padding: '0.5rem 0.75rem',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          color: 'var(--text-primary)',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
        }}
      />
    </div>
  );
}

function Preview({ colors, tema }: { colors: ThemeColors; tema: string }) {
  const style = {
    '--p': colors.corPrincipal,
    '--s': colors.corSecundaria,
    '--d': colors.corDestaque,
    '--bg': colors.corFundo,
    '--bg2': colors.corSuperficie,
    '--t': colors.corTexto,
    '--tm': colors.corTextoSecundario,
  } as React.CSSProperties;

  return (
    <div style={{ ...style, background: colors.corFundo, borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      {/* Header preview */}
      <div style={{ background: colors.corSuperficie, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: `1px solid ${colors.corBorda}` }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: colors.corPrincipal }} />
        <span style={{ color: colors.corTexto, fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '0.9rem' }}>IADMP</span>
        <div style={{ flex: 1 }} />
        {['Inicio', 'Eventos', 'Galeria'].map((item) => (
          <span key={item} style={{ color: colors.corTextoSecundario, fontSize: '0.75rem' }}>{item}</span>
        ))}
      </div>

      {/* Content preview */}
      <div style={{ padding: '2rem 1.5rem' }}>
        <h3 style={{ color: colors.corTexto, fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', marginBottom: '0.5rem' }}>Exemplo de Titulo</h3>
        <p style={{ color: colors.corTextoSecundario, fontSize: '0.8rem', marginBottom: '1rem' }}>Texto descritivo com a cor secundaria do tema.</p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <span style={{ background: colors.corPrincipal, color: colors.corFundo, padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>Botao Principal</span>
          <span style={{ background: 'transparent', color: colors.corPrincipal, border: `1.5px solid ${colors.corPrincipal}`, padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>Botao Outline</span>
        </div>

        <div style={{ background: colors.corSuperficie, border: `1px solid ${colors.corBorda}`, borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
          <p style={{ color: colors.corPrincipal, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Versiculo do Dia</p>
          <p style={{ color: colors.corTexto, fontSize: '0.85rem', fontStyle: 'italic' }}>&ldquo;O Senhor e a minha luz e a minha salvacao.&rdquo;</p>
          <p style={{ color: colors.corTextoSecundario, fontSize: '0.75rem', marginTop: '0.5rem', borderTop: `1px solid ${colors.corBorda}`, paddingTop: '0.5rem' }}>Reflexao: Uma mensagem de esperanca...</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ background: colors.corSuperficie, border: `1px solid ${colors.corBorda}`, borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
            <p style={{ color: colors.corPrincipal, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Domingo</p>
            <p style={{ color: colors.corTexto, fontSize: '0.8rem' }}>Culto 18h30</p>
          </div>
          <div style={{ background: colors.corSuperficie, border: `1px solid ${colors.corBorda}`, borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
            <p style={{ color: colors.corPrincipal, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Terca</p>
            <p style={{ color: colors.corTexto, fontSize: '0.8rem' }}>Doutrina 19h30</p>
          </div>
        </div>

        {/* Warning preview */}
        <div style={{ marginTop: '1rem', background: `${colors.corSecundaria}1a`, border: `1px solid ${colors.corSecundaria}40`, borderRadius: '8px', padding: '0.75rem' }}>
          <p style={{ color: colors.corSecundaria, fontSize: '0.8rem' }}>Aviso importante para a comunidade.</p>
        </div>
      </div>

      {/* Footer preview */}
      <div style={{ background: colors.corSuperficie, padding: '1rem 1.5rem', borderTop: `1px solid ${colors.corBorda}` }}>
        <p style={{ color: colors.corTextoSecundario, fontSize: '0.7rem', textAlign: 'center' }}>&copy; 2026 IADMP. Todos os direitos reservados.</p>
      </div>
    </div>
  );
}

export default function AparenciaPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activePalette, setActivePalette] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/configuracoes')
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => {
        setConfig({
          nomeIgreja: 'Igreja Assembleia de Deus Ministerio da Promessa',
          logoUrl: null,
          logoDarkUrl: null,
          faviconUrl: null,
          ...defaultColors,
          tema: 'dark',
        });
        setLoading(false);
      });
  }, []);

  const updateColor = useCallback((key: keyof ThemeColors, value: string) => {
    setConfig((prev) => prev ? { ...prev, [key]: value } : prev);
    setActivePalette(null);
  }, []);

  const applyPalette = useCallback((palette: typeof palettes[0]) => {
    setConfig((prev) => prev ? { ...prev, ...palette.colors } : prev);
    setActivePalette(palette.id);
  }, []);

  const restoreDefaults = useCallback(() => {
    setConfig((prev) => prev ? { ...prev, ...defaultColors, tema: 'dark' } : prev);
    setActivePalette(null);
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        window.dispatchEvent(new CustomEvent('theme-updated', { detail: config }));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return <p style={{ color: 'var(--text-muted)' }}>Carregando configuracoes...</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Aparencia do Site</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Personalize as cores e identidade visual do site.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={restoreDefaults} className="btn btn-outline" style={{ fontSize: '0.8rem' }}>
            <RotateCcw size={14} /> Restaurar padrao
          </button>
          <button onClick={handleSave} className="btn" style={{ fontSize: '0.8rem' }} disabled={saving}>
            <Save size={14} /> {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar alteracoes'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Left: Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Identidade */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Identidade</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minWidth: '120px' }}>Nome da Igreja</label>
                <input
                  type="text"
                  value={config.nomeIgreja}
                  onChange={(e) => setConfig({ ...config, nomeIgreja: e.target.value })}
                  style={{ flex: 1, padding: '0.5rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minWidth: '120px' }}>Logo URL</label>
                <input
                  type="text"
                  value={config.logoUrl || ''}
                  onChange={(e) => setConfig({ ...config, logoUrl: e.target.value || null })}
                  placeholder="/images/logo.png"
                  style={{ flex: 1, padding: '0.5rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Cores */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Cores</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {colorFields.map(({ key, label }) => (
                <ColorInput
                  key={key}
                  label={label}
                  value={config[key]}
                  onChange={(v) => updateColor(key, v)}
                />
              ))}
            </div>
          </div>

          {/* Tema */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Tema</h3>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {['dark', 'light', 'auto'].map((t) => (
                <button
                  key={t}
                  onClick={() => setConfig({ ...config, tema: t })}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    border: `2px solid ${config.tema === t ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    background: config.tema === t ? 'var(--gradient-gold-soft)' : 'transparent',
                    color: config.tema === t ? 'var(--color-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    transition: 'var(--transition)',
                  }}
                >
                  {t === 'dark' ? 'Escuro' : t === 'light' ? 'Claro' : 'Automatico'}
                </button>
              ))}
            </div>
          </div>

          {/* Paletas */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
              <Palette size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
              Paletas Pre-definidas
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>Cores baseadas na identidade visual da logo da igreja.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {palettes.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPalette(p)}
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    border: `2px solid ${activePalette === p.id ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    background: 'var(--bg-input)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'var(--transition)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '0.5rem' }}>
                    {[p.colors.corPrincipal, p.colors.corSecundaria, p.colors.corDestaque, p.colors.corFundo, p.colors.corSuperficie].map((c, i) => (
                      <div key={i} style={{ width: '20px', height: '20px', borderRadius: '4px', background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>{p.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.25rem' }}>{p.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div style={{ position: 'sticky', top: 'calc(var(--header-height) + 1rem)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
            <Eye size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Pre-visualizacao
          </h3>
          <Preview colors={config} tema={config.tema} />
        </div>
      </div>
    </div>
  );
}
