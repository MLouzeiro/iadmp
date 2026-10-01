'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Shield, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import SectionHead from '@/components/ui/SectionHead';
import Button from '@/components/ui/Button';
import SearchBar from '@/components/ui/SearchBar';
import Select from '@/components/ui/Select';
import styles from '@/components/ui/form.module.css';

interface Usuario {
  id: string;
  name: string;
  email: string;
  telefone: string | null;
  role: string;
  ativo: boolean;
  createdAt: string;
  perfilNome: string | null;
  organizacoes: { id: string; nome: string }[];
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_IGREJA: 'Admin Igreja',
  LIDER: 'Lider',
  COORDENADOR: 'Coordenador',
  MUSICO: 'Musico',
  MEMBER: 'Membro',
  ADMIN: 'Admin',
  PASTOR: 'Pastor',
  SECRETARIA: 'Secretaria',
  FINANCEIRO: 'Financeiro',
  LIDER_MINISTERIO: 'Lider Ministerio',
  EDITOR_SITE: 'Editor Site',
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: '#e74c3c',
  ADMIN_IGREJA: '#c8960c',
  LIDER: '#2196f3',
  COORDENADOR: '#4caf50',
  MUSICO: '#9c27b0',
  MEMBER: '#607d8b',
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterAtivo, setFilterAtivo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchUsuarios = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterRole) params.set('role', filterRole);
    if (filterAtivo) params.set('ativo', filterAtivo);
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    fetch(`/api/usuarios?${params}`)
      .then((res) => res.json())
      .then((d) => { setUsuarios(d.usuarios || []); setTotal(d.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchUsuarios(); }, [search, filterRole, filterAtivo, page]);

  const handleToggleAtivo = async (id: string, currentAtivo: boolean) => {
    const res = await fetch(`/api/usuarios/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !currentAtivo }),
    });
    if (res.ok) fetchUsuarios();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuario "${name}"?`)) return;
    const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
    if (res.ok) fetchUsuarios();
    else {
      const data = await res.json();
      alert(data.error || 'Erro ao excluir');
    }
  };

  const roleOptions = Object.entries(roleLabels).map(([value, label]) => ({ value, label }));
  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'true', label: 'Ativos' },
    { value: 'false', label: 'Inativos' },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className={styles.pageHeader}>
        <SectionHead icon={<Shield size={24} />} title="Gestao de Usuarios" />
        <Button icon={<Plus size={16} />} onClick={() => window.location.href = '/admin/usuarios/novo'} size="sm">
          Novo Usuario
        </Button>
      </div>

      <div className={styles.toolbar}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nome ou email..." />
        <Select options={roleOptions} value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1); }} />
        <Select options={statusOptions} value={filterAtivo} onChange={(e) => { setFilterAtivo(e.target.value); setPage(1); }} />
      </div>

      <div style={{ marginTop: '1rem' }}>
        {loading ? (
          <p className={styles.loadingState}>Carregando...</p>
        ) : usuarios.length === 0 ? (
          <p className={styles.emptyState}>Nenhum usuario encontrado.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {usuarios.map((usuario) => (
              <div key={usuario.id} className={styles.listItem}>
                <div className={styles.listItemInfo}>
                  <h4>{usuario.name}</h4>
                  <p>
                    {usuario.email}
                    {usuario.organizacoes.length > 0 && ` | ${usuario.organizacoes.map(o => o.nome).join(', ')}`}
                  </p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Criado em {new Date(usuario.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className={styles.listItemActions}>
                  <span className={styles.badge} style={{ background: roleColors[usuario.role] || '#607d8b', color: '#fff' }}>
                    {roleLabels[usuario.role] || usuario.role}
                  </span>
                  <span className={styles.badge} style={{ background: usuario.ativo ? '#4caf50' : '#9e9e9e', color: '#fff' }}>
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  <Button variant="ghost" icon={<Edit size={16} />} onClick={() => window.location.href = `/admin/usuarios/${usuario.id}/editar`} />
                  <Button variant="ghost" icon={usuario.ativo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />} onClick={() => handleToggleAtivo(usuario.id, usuario.ativo)} />
                  <Button variant="ghost" icon={<Trash2 size={16} />} onClick={() => handleDelete(usuario.id, usuario.name)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Pagina {page} de {totalPages}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Proximo</Button>
        </div>
      )}
    </div>
  );
}
