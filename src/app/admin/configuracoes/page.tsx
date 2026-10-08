'use client';

import { useEffect, useState } from 'react';
import { Settings, Save, RotateCcw, Building2 } from 'lucide-react';
import PageHead from '@/components/ui/PageHead';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import styles from '@/components/ui/form.module.css';

interface Config {
  nomeIgreja: string;
  logoUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
  tema: string;
}

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<Config>({ nomeIgreja: '', logoUrl: '', logoDarkUrl: '', faviconUrl: '', tema: 'dark' });
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch('/api/configuracoes')
      .then((r) => r.json())
      .then((d) => {
        setConfig({
          nomeIgreja: d.nomeIgreja || '',
          logoUrl: d.logoUrl || '',
          logoDarkUrl: d.logoDarkUrl || '',
          faviconUrl: d.faviconUrl || '',
          tema: d.tema || 'dark',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const salvar = async () => {
    setSalvando(true);
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        toast('Configurações salvas.', 'ok');
      } else {
        const d = await res.json().catch(() => ({}));
        toast(d.error || 'Erro ao salvar configurações.', 'err');
      }
    } catch {
      toast('Erro de conexão.', 'err');
    } finally {
      setSalvando(false);
    }
  };

  const restaurar = () => {
    setConfig({
      nomeIgreja: 'Igreja Assembleia de Deus Ministério da Promessa',
      logoUrl: '/images/logo.png',
      logoDarkUrl: '',
      faviconUrl: '',
      tema: 'dark',
    });
    toast('Valores padrão restaurados (não salvos).', 'info');
  };

  if (loading) {
    return <div className={styles.loadingState}>Carregando configurações...</div>;
  }

  return (
    <div>
      <PageHead
        title="Configurações"
        subtitle="Identidade visual · logo · favicon · tema padrão"
        actions={
          <>
            <Button variant="secondary" icon={<RotateCcw size={15} />} onClick={restaurar} size="sm">Restaurar padrão</Button>
            <Button icon={<Save size={15} />} onClick={salvar} size="sm" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </>
        }
      />

      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <div>
            <h3 className={styles.formHeaderTitle}>Identidade da Igreja</h3>
            <p className={styles.formHeaderSubtitle}>Informações exibidas no site público e no painel</p>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-gold-soft)', display: 'grid', placeItems: 'center', color: 'var(--text-accent)' }}>
            <Building2 size={20} />
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGridFull}>
            <Input
              label="Nome da igreja"
              value={config.nomeIgreja}
              onChange={(e) => setConfig({ ...config, nomeIgreja: e.target.value })}
            />
          </div>
          <Input
            label="Logo (tema claro)"
            value={config.logoUrl}
            onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
            placeholder="/images/logo.png"
          />
          <Input
            label="Logo (tema escuro)"
            value={config.logoDarkUrl}
            onChange={(e) => setConfig({ ...config, logoDarkUrl: e.target.value })}
            placeholder="/images/logo-dark.png"
          />
          <Input
            label="Favicon"
            value={config.faviconUrl}
            onChange={(e) => setConfig({ ...config, faviconUrl: e.target.value })}
            placeholder="/images/favicon.ico"
          />
          <Select
            label="Tema padrão"
            value={config.tema}
            onChange={(e) => setConfig({ ...config, tema: e.target.value })}
            options={[
              { value: 'dark', label: 'Escuro' },
              { value: 'light', label: 'Claro' },
              { value: 'auto', label: 'Automático (sistema)' },
            ]}
          />
        </div>
      </div>

      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <div>
            <h3 className={styles.formHeaderTitle}>Permissões do Sistema</h3>
            <p className={styles.formHeaderSubtitle}>Controle de acesso por perfil e módulo</p>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-gold-soft)', display: 'grid', placeItems: 'center', color: 'var(--text-accent)' }}>
            <Settings size={20} />
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7 }}>
          As permissões usam o formato <code style={{ color: 'var(--text-primary)' }}>módulo:ação</code> e são
          atribuídas por perfil (SUPER_ADMIN, ADMIN_IGREJA, PASTOR, LIDER, COORDENADOR, SECRETARIA,
          FINANCEIRO, EDITOR_SITE, MUSICO, MEMBER) ou por exceção em <code style={{ color: 'var(--text-primary)' }}>UsuarioPermissao</code>.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.85rem' }}>
          A gestão de perfis e permissões fica em <strong style={{ color: 'var(--text-primary)' }}>Usuários</strong>,
          onde cada usuário pode ter permissões granulares por módulo.
        </p>
      </div>
    </div>
  );
}
