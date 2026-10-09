'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormCard from '@/components/ui/FormCard';
import FormGrid from '@/components/ui/FormGrid';
import { useToast } from '@/components/ui/Toast';
import styles from '@/components/ui/form.module.css';

interface SiteConfig {
  anoFundacao: string;
  statMembros: boolean;
  statCongregacoes: boolean;
  statLideres: boolean;
  statAnosHistoria: boolean;
  statMinisterios: boolean;
  rodapeDescricao: string;
  rodapeEndereco: string;
  rodapeTelefone: string;
  rodapeEmail: string;
  rodapeWhatsapp: string;
  rodapeYoutube: string;
  rodapeInstagram: string;
  rodapeFacebook: string;
}

const statLabels: { key: keyof SiteConfig; label: string; detalhe: string }[] = [
  { key: 'statMembros', label: 'Membros', detalhe: 'Contagem automática de membros ativos' },
  { key: 'statCongregacoes', label: 'Congregações', detalhe: 'Contagem automática de congregações ativas' },
  { key: 'statLideres', label: 'Líderes', detalhe: 'Contagem automática de líderes ativos' },
  { key: 'statAnosHistoria', label: 'Anos de História', detalhe: 'Calculado pelo ano de fundação' },
  { key: 'statMinisterios', label: 'Ministérios', detalhe: 'Contagem automática de ministérios ativos' },
];

const rodapeFields: { key: keyof SiteConfig; label: string; placeholder: string; type?: string }[] = [
  { key: 'rodapeDescricao', label: 'Descrição da igreja', placeholder: 'Uma comunidade de fé, amor e esperança...' },
  { key: 'rodapeEndereco', label: 'Endereço', placeholder: 'Maranhão, Brasil' },
  { key: 'rodapeTelefone', label: 'Telefone', placeholder: '+55 98 98803-5646' },
  { key: 'rodapeEmail', label: 'E-mail', placeholder: 'contato@iadmp.com.br', type: 'email' },
  { key: 'rodapeWhatsapp', label: 'WhatsApp (link)', placeholder: 'https://wa.me/5598988035646' },
  { key: 'rodapeYoutube', label: 'YouTube (link)', placeholder: 'https://youtube.com/@...' },
  { key: 'rodapeInstagram', label: 'Instagram (link)', placeholder: 'https://instagram.com/...' },
  { key: 'rodapeFacebook', label: 'Facebook (link)', placeholder: 'https://facebook.com/...' },
];

export default function ConfiguracoesSitePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organizacaoId, setOrganizacaoId] = useState<string | null>(null);
  const [form, setForm] = useState<SiteConfig>({
    anoFundacao: '',
    statMembros: false,
    statCongregacoes: true,
    statLideres: true,
    statAnosHistoria: true,
    statMinisterios: true,
    rodapeDescricao: '',
    rodapeEndereco: '',
    rodapeTelefone: '',
    rodapeEmail: '',
    rodapeWhatsapp: '',
    rodapeYoutube: '',
    rodapeInstagram: '',
    rodapeFacebook: '',
  });

  useEffect(() => {
    fetch('/api/configuracoes')
      .then((r) => r.json())
      .then((data) => {
        setOrganizacaoId(data.organizacaoId || null);
        setForm({
          anoFundacao: data.anoFundacao != null ? String(data.anoFundacao) : '',
          statMembros: data.statMembros ?? false,
          statCongregacoes: data.statCongregacoes ?? true,
          statLideres: data.statLideres ?? true,
          statAnosHistoria: data.statAnosHistoria ?? true,
          statMinisterios: data.statMinisterios ?? true,
          rodapeDescricao: data.rodapeDescricao || '',
          rodapeEndereco: data.rodapeEndereco || '',
          rodapeTelefone: data.rodapeTelefone || '',
          rodapeEmail: data.rodapeEmail || '',
          rodapeWhatsapp: data.rodapeWhatsapp || '',
          rodapeYoutube: data.rodapeYoutube || '',
          rodapeInstagram: data.rodapeInstagram || '',
          rodapeFacebook: data.rodapeFacebook || '',
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (key: keyof SiteConfig) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(organizacaoId ? { organizacaoId } : {}),
          anoFundacao: form.anoFundacao ? parseInt(form.anoFundacao, 10) : null,
          statMembros: form.statMembros,
          statCongregacoes: form.statCongregacoes,
          statLideres: form.statLideres,
          statAnosHistoria: form.statAnosHistoria,
          statMinisterios: form.statMinisterios,
          rodapeDescricao: form.rodapeDescricao || null,
          rodapeEndereco: form.rodapeEndereco || null,
          rodapeTelefone: form.rodapeTelefone || null,
          rodapeEmail: form.rodapeEmail || null,
          rodapeWhatsapp: form.rodapeWhatsapp || null,
          rodapeYoutube: form.rodapeYoutube || null,
          rodapeInstagram: form.rodapeInstagram || null,
          rodapeFacebook: form.rodapeFacebook || null,
        }),
      });
      if (res.ok) {
        toast('Configurações do site salvas.', 'ok');
        window.dispatchEvent(new CustomEvent('theme-updated', { detail: {} }));
      } else {
        const d = await res.json().catch(() => ({}));
        toast(d.error || 'Erro ao salvar.', 'err');
      }
    } catch {
      toast('Erro ao salvar.', 'err');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className={styles.loadingState}>Carregando...</p>;
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Rodapé e Home</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Informações do rodapé e estatísticas exibidas no topo do site público.
          </p>
        </div>
        <Button icon={<Save size={14} />} onClick={handleSave} size="sm" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>

      <FormCard title="Fundação da igreja">
        <FormGrid>
          <Input
            label="Ano de fundação"
            type="number"
            value={form.anoFundacao}
            placeholder="Ex.: 2014"
            onChange={(e) => setForm({ ...form, anoFundacao: e.target.value })}
          />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', alignSelf: 'center' }}>
            Os “Anos de História” do site são calculados automaticamente: ano atual − ano de fundação.
            Sem preenchimento, o site mantém o valor padrão.
          </p>
        </FormGrid>
      </FormCard>

      <FormCard title="Estatísticas do topo da home">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
          Ative os indicadores que deseja exibir no hero do site público. Congregações, Líderes e
          Ministérios são atualizados automaticamente do banco de dados.
        </p>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {statLabels.map(({ key, label, detalhe }) => (
            <label
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: `1.5px solid ${form[key] ? 'var(--color-primary)' : 'var(--border-color)'}`,
                background: form[key] ? 'rgba(201, 168, 76, 0.08)' : 'var(--bg-input)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                type="checkbox"
                checked={Boolean(form[key])}
                onChange={() => toggle(key)}
                style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
              />
              <span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600, display: 'block' }}>
                  {label}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{detalhe}</span>
              </span>
            </label>
          ))}
        </div>
      </FormCard>

      <FormCard title="Rodapé do site">
        <FormGrid>
          {rodapeFields.map(({ key, label, placeholder, type }) => (
            <Input
              key={key}
              label={label}
              type={type || 'text'}
              value={String(form[key] ?? '')}
              placeholder={placeholder}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          ))}
        </FormGrid>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
          Campos vazios usam automaticamente as informações padrão do site.
        </p>
      </FormCard>
    </div>
  );
}
