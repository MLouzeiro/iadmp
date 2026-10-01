'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import SectionHead from '@/components/ui/SectionHead';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import FormCard from '@/components/ui/FormCard';
import FormGrid from '@/components/ui/FormGrid';
import styles from '@/components/ui/form.module.css';

interface Organizacao {
  id: string;
  nome: string;
}

interface Permissao {
  id: string;
  modulo: string;
  acao: string;
}

interface Perfil {
  id: string;
  nome: string;
  descricao: string | null;
  permissoes: { permissao: Permissao }[];
}

interface UsuarioData {
  id: string;
  name: string;
  email: string;
  telefone: string | null;
  role: string;
  ativo: boolean;
  perfilId: string | null;
  perfilNome: string | null;
  organizacoes: { id: string; nome: string }[];
  permissoes: { modulo: string; acao: string; concedida: boolean }[];
}

const roleOptions = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN_IGREJA', label: 'Administrador da Igreja' },
  { value: 'LIDER', label: 'Lider' },
  { value: 'COORDENADOR', label: 'Coordenador' },
  { value: 'MUSICO', label: 'Musico' },
  { value: 'MEMBER', label: 'Membro' },
];

const statusOptions = [
  { value: 'true', label: 'Ativo' },
  { value: 'false', label: 'Inativo' },
];

const moduloLabels: Record<string, string> = {
  Dashboard: 'Dashboard',
  Membros: 'Membros',
  Lideranca: 'Lideranca',
  Eventos: 'Eventos',
  Financeiro: 'Financeiro',
  Liturgia: 'Liturgia',
  Avisos: 'Avisos',
  Galeria: 'Galeria',
  Oportunidades: 'Oportunidades',
  Configuracoes: 'Configuracoes',
  Usuarios: 'Usuarios',
};

const acaoLabels: Record<string, string> = {
  visualizar: 'Visualizar',
  criar: 'Criar',
  editar: 'Editar',
  excluir: 'Excluir',
};

export default function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    email: '',
    telefone: '',
    password: '',
    confirmPassword: '',
    role: 'MEMBER',
    perfilId: '',
    ativo: 'true',
  });

  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([]);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [customPerms, setCustomPerms] = useState<Record<string, boolean>>({});
  const [isCustomPerms, setIsCustomPerms] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/organizacoes').then(r => r.json()),
      fetch('/api/perfis').then(r => r.json()),
      fetch('/api/permissoes').then(r => r.json()),
      fetch(`/api/usuarios/${id}`).then(r => r.json()),
    ]).then(([orgs, pfs, perms, user]) => {
      setOrganizacoes(Array.isArray(orgs) ? orgs : []);
      setPerfis(Array.isArray(pfs) ? pfs : []);
      setPermissoes(Array.isArray(perms) ? perms : []);

      if (user.error) {
        setError(user.error);
        setLoading(false);
        return;
      }

      setForm({
        name: user.name || '',
        email: user.email || '',
        telefone: user.telefone || '',
        password: '',
        confirmPassword: '',
        role: user.role || 'MEMBER',
        perfilId: user.perfilId || '',
        ativo: user.ativo ? 'true' : 'false',
      });

      setSelectedOrgs(user.organizacoes?.map((o: any) => o.id) || []);

      const userPerms: Record<string, boolean> = {};
      user.permissoes?.forEach((p: any) => {
        userPerms[`${p.modulo.toLowerCase()}:${p.acao}`] = p.concedida;
      });
      setCustomPerms(userPerms);
      setIsCustomPerms(false);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!form.perfilId || form.role === 'SUPER_ADMIN') {
      if (form.role === 'SUPER_ADMIN') {
        const allPerms: Record<string, boolean> = {};
        permissoes.forEach(p => { allPerms[`${p.modulo.toLowerCase()}:${p.acao}`] = true; });
        setCustomPerms(allPerms);
        setIsCustomPerms(false);
      }
      return;
    }

    const perfil = perfis.find(p => p.id === form.perfilId);
    if (!perfil) return;

    const perfilPerms: Record<string, boolean> = {};
    perfil.permissoes.forEach(pp => {
      perfilPerms[`${pp.permissao.modulo.toLowerCase()}:${pp.permissao.acao}`] = true;
    });
    setCustomPerms(perfilPerms);
    setIsCustomPerms(false);
  }, [form.perfilId, form.role, perfis, permissoes]);

  const handlePermChange = (key: string, value: boolean) => {
    setCustomPerms(prev => ({ ...prev, [key]: value }));
    setIsCustomPerms(true);
  };

  const handleSelectAllOrgs = () => setSelectedOrgs(organizacoes.map(o => o.id));
  const handleClearOrgs = () => setSelectedOrgs([]);
  const toggleOrg = (orgId: string) => {
    setSelectedOrgs(prev => prev.includes(orgId) ? prev.filter(x => x !== orgId) : [...prev, orgId]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password && form.password !== form.confirmPassword) {
      setError('As senhas nao conferem');
      return;
    }

    if (form.role !== 'SUPER_ADMIN' && selectedOrgs.length === 0) {
      setError('Selecione pelo menos uma organizacao para este usuario');
      return;
    }

    setSaving(true);
    try {
      const body: any = {
        name: form.name,
        email: form.email,
        telefone: form.telefone || null,
        role: form.role,
        perfilId: form.perfilId || null,
        ativo: form.ativo === 'true',
        organizacoes: form.role === 'SUPER_ADMIN' ? [] : selectedOrgs,
        permissoes: customPerms,
      };

      if (form.password) {
        body.password = form.password;
        body.confirmPassword = form.confirmPassword;
      }

      const res = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao salvar usuario');
        return;
      }

      router.push('/admin/usuarios');
    } catch {
      setError('Erro ao salvar usuario');
    } finally {
      setSaving(false);
    }
  };

  const groupedPerms = permissoes.reduce((acc, p) => {
    if (!acc[p.modulo]) acc[p.modulo] = [];
    acc[p.modulo].push(p);
    return acc;
  }, {} as Record<string, Permissao[]>);

  if (loading) {
    return <p className={styles.loadingState}>Carregando...</p>;
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <SectionHead icon={<span>✏️</span>} title="Editar Usuario" subtitle="Altere os dados e permissoes do usuario" />
        <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => router.push('/admin/usuarios')} size="sm">
          Voltar
        </Button>
      </div>

      {error && (
        <div style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.3)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#e74c3c', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <FormCard title="Dados Pessoais">
          <FormGrid>
            <Input label="Nome completo" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Telefone" type="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            <Select label="Status" options={statusOptions} value={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.value })} />
            <Input label="Nova senha (deixe vazio para manter)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {form.password && (
              <Input label="Confirmar nova senha" type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
            )}
          </FormGrid>
        </FormCard>

        <FormCard title="Perfil">
          <FormGrid>
            <Select
              label="Perfil/Funcao"
              required
              options={roleOptions}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value, perfilId: '' })}
            />
            {form.role !== 'SUPER_ADMIN' && (
              <Select
                label="Perfil de permissoes"
                options={perfis.map(p => ({ value: p.id, label: `${p.nome} - ${p.descricao || ''}` }))}
                value={form.perfilId}
                onChange={(e) => setForm({ ...form, perfilId: e.target.value })}
              />
            )}
          </FormGrid>
        </FormCard>

        {form.role !== 'SUPER_ADMIN' && (
          <FormCard title="Igrejas autorizadas">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <Button variant="secondary" size="sm" type="button" onClick={handleSelectAllOrgs}>Selecionar todas</Button>
              <Button variant="secondary" size="sm" type="button" onClick={handleClearOrgs}>Limpar selecao</Button>
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                {selectedOrgs.length} selecionada(s)
              </span>
            </div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {organizacoes.map((org) => (
                <label
                  key={org.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `1.5px solid ${selectedOrgs.includes(org.id) ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    background: selectedOrgs.includes(org.id) ? 'rgba(201, 168, 76, 0.08)' : 'var(--bg-input)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedOrgs.includes(org.id)}
                    onChange={() => toggleOrg(org.id)}
                    style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{org.nome}</span>
                </label>
              ))}
            </div>
          </FormCard>
        )}

        {form.role !== 'SUPER_ADMIN' && (
          <FormCard title="Permissoes de acesso">
            {isCustomPerms && (
              <div style={{ background: 'rgba(201, 168, 76, 0.1)', border: '1px solid rgba(201, 168, 76, 0.3)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', marginBottom: '1rem', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                Permissoes personalizadas
              </div>
            )}
            <div style={{ display: 'grid', gap: '1rem' }}>
              {Object.entries(groupedPerms).map(([modulo, perms]) => (
                <div key={modulo}>
                  <h4 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {moduloLabels[modulo] || modulo}
                  </h4>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {perms.map((p) => {
                      const key = `${p.modulo.toLowerCase()}:${p.acao}`;
                      return (
                        <label
                          key={key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            color: customPerms[key] ? 'var(--color-primary)' : 'var(--text-muted)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!customPerms[key]}
                            onChange={(e) => handlePermChange(key, e.target.checked)}
                            style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
                          />
                          {acaoLabels[p.acao] || p.acao}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </FormCard>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Button variant="secondary" type="button" onClick={() => router.push('/admin/usuarios')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving} icon={<Save size={16} />}>
            {saving ? 'Salvando...' : 'Salvar Alteracoes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
