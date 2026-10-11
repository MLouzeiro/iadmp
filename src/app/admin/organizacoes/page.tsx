'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Building2, Eye, Check, X } from 'lucide-react';
import PageHead from '@/components/ui/PageHead';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal, { ModalField } from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import SearchBar from '@/components/ui/SearchBar';
import { useToast } from '@/components/ui/Toast';
import styles from '@/components/ui/form.module.css';

interface Organizacao {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  ativo: boolean;
  dominioPersonalizado: string | null;
  createdAt: string;
  _count?: {
    usuarios: number;
    membros: number;
    liderancas: number;
    eventos: number;
    congregacoes: number;
  };
  configuracoes?: { nomeIgreja: string } | null;
}

export default function OrganizacoesPage() {
  const { toast, confirm } = useToast();
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Organizacao | null>(null);
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    slug: '',
    dominioPersonalizado: '',
    ativo: true,
  });

  const fetchOrganizacoes = useCallback(() => {
    fetch('/api/organizacoes')
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : d?.organizacoes || [];
        setOrganizacoes(list);
      })
      .catch(() => setOrganizacoes([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrganizacoes(); }, [fetchOrganizacoes]);

  const openNovo = () => {
    setEditando(null);
    setForm({ nome: '', descricao: '', slug: '', dominioPersonalizado: '', ativo: true });
    setModalOpen(true);
  };

  const openEditar = (org: Organizacao) => {
    setEditando(org);
    setForm({
      nome: org.nome,
      descricao: org.descricao || '',
      slug: org.slug,
      dominioPersonalizado: org.dominioPersonalizado || '',
      ativo: org.ativo,
    });
    setModalOpen(true);
  };

  const openDetalhes = (org: Organizacao) => {
    window.location.href = `/admin/organizacoes/${org.id}`;
  };

  const salvar = async () => {
    if (!form.nome.trim()) {
      toast('Nome é obrigatório.', 'warn');
      return;
    }
    if (!form.slug.trim()) {
      toast('Slug é obrigatório.', 'warn');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(form.slug)) {
      toast('Slug deve conter apenas letras minúsculas, números e hífens.', 'warn');
      return;
    }

    const payload = {
      nome: form.nome,
      descricao: form.descricao || undefined,
      slug: form.slug,
      dominioPersonalizado: form.dominioPersonalizado || undefined,
      ativo: form.ativo,
    };

    const url = editando ? `/api/organizacoes/${editando.id}` : '/api/organizacoes';
    const method = editando ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast(editando ? 'Organização atualizada.' : 'Organização criada.', 'ok');
      setModalOpen(false);
      fetchOrganizacoes();
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error || 'Erro ao salvar organização.', 'err');
    }
  };

  const excluir = (org: Organizacao) => {
    confirm(`Excluir a organização "${org.nome}"? Esta ação não pode ser desfeita.`, async () => {
      const res = await fetch(`/api/organizacoes/${org.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Organização excluída.', 'ok');
        fetchOrganizacoes();
      } else {
        toast('Erro ao excluir organização.', 'err');
      }
    }, { title: 'Excluir organização', danger: true });
  };

  const campos: ModalField[] = [
    { name: 'nome', label: 'Nome', value: form.nome, required: true },
    { name: 'slug', label: 'Slug (URL)', value: form.slug, required: true, placeholder: 'ex: minha-igreja' },
    { name: 'descricao', label: 'Descrição', type: 'textarea', value: form.descricao },
    { name: 'dominioPersonalizado', label: 'Domínio personalizado (opcional)', value: form.dominioPersonalizado, placeholder: 'ex: igreja.exemplo.com' },
    { name: 'ativo', label: 'Ativa', type: 'checkbox', value: form.ativo, placeholder: 'Organização ativa e acessível' },
  ];

  const onChange = (name: string, value: string | number | boolean) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const filtrados = organizacoes.filter((o) =>
    !search ||
    o.nome.toLowerCase().includes(search.toLowerCase()) ||
    o.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHead
        title="Organizações"
        subtitle="Cadastro de igrejas/congregações do sistema (SUPER_ADMIN)"
        actions={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Nova Organização</Button>}
      />

      <div className={styles.toolbar}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar organização..." />
      </div>

      {loading ? (
        <div className={styles.loadingState}>Carregando organizações...</div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={<Building2 size={30} />}
          title="Nenhuma organização encontrada"
          message={search ? 'Tente outro termo de busca.' : 'Cadastre a primeira organização do sistema.'}
          action={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Nova Organização</Button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtrados.map((org) => (
            <div key={org.id} className={styles.listItem}>
              <div className={styles.listItemAvatar}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gradient-gold-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={20} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div className={styles.listItemInfo}>
                  <h4>{org.nome}</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Slug: <code style={{ background: 'var(--bg-input)', padding: '0 0.3rem', borderRadius: '2px' }}>{org.slug}</code>
                    {org.dominioPersonalizado && ` · Domínio: ${org.dominioPersonalizado}`}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Membros: {org._count?.membros ?? 0} · Líderes: {org._count?.liderancas ?? 0} · Eventos: {org._count?.eventos ?? 0} · Congregações: {org._count?.congregacoes ?? 0}
                  </p>
                </div>
              </div>
              <div className={styles.listItemActions}>
                <Badge variant={org.ativo ? 'success' : 'error'}>{org.ativo ? 'ATIVA' : 'INATIVA'}</Badge>
                <Button size="sm" variant="secondary" icon={<Eye size={14} />} onClick={() => openDetalhes(org)}>Detalhes</Button>
                <Button size="sm" variant="secondary" icon={<Pencil size={14} />} onClick={() => openEditar(org)}>Editar</Button>
                <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => excluir(org)}>Excluir</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editando ? 'Editar Organização' : 'Nova Organização'}
        description="POST/PUT /api/organizacoes · schema Zod criarOrganizacaoSchema"
        fields={campos}
        values={form as unknown as Record<string, string | number | boolean>}
        onChange={onChange}
        onClose={() => setModalOpen(false)}
        onSave={salvar}
        saveLabel={editando ? 'Salvar alterações' : 'Criar organização'}
      />
    </div>
  );
}