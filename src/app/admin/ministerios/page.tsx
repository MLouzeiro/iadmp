'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import PageHead from '@/components/ui/PageHead';
import Button from '@/components/ui/Button';
import Badge, { statusBadgeVariant } from '@/components/ui/Badge';
import Modal, { ModalField } from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import SearchBar from '@/components/ui/SearchBar';
import { useToast } from '@/components/ui/Toast';
import styles from '@/components/ui/form.module.css';
import { useOrganizacoes } from '@/hooks/useOrganizacoes';

interface Ministerio {
  id: string;
  nome: string;
  descricao: string | null;
  responsavel: string | null;
  ativo: boolean;
  organizacaoId?: string;
}

export default function MinisteriosAdminPage() {
  const { toast, confirm } = useToast();
  const { orgs, loading: orgsLoading, multiOrg, orgAtualId } = useOrganizacoes();
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Ministerio | null>(null);
  const [form, setForm] = useState({
    organizacaoId: '',
    nome: '',
    descricao: '',
    responsavel: '',
    ativo: true,
  });

  const fetchMinisterios = useCallback(() => {
    fetch('/api/ministerios?incluirInativos=true')
      .then((r) => r.json())
      .then((d) => setMinisterios(Array.isArray(d) ? d : []))
      .catch(() => setMinisterios([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMinisterios(); }, [fetchMinisterios]);

  const openNovo = () => {
    setEditando(null);
    setForm({
      organizacaoId: orgAtualId || (orgs.length === 1 ? orgs[0].id : ''),
      nome: '',
      descricao: '',
      responsavel: '',
      ativo: true,
    });
    setModalOpen(true);
  };

  const openEditar = (m: Ministerio) => {
    setEditando(m);
    setForm({
      organizacaoId: m.organizacaoId || orgAtualId || (orgs.length === 1 ? orgs[0].id : ''),
      nome: m.nome,
      descricao: m.descricao || '',
      responsavel: m.responsavel || '',
      ativo: m.ativo,
    });
    setModalOpen(true);
  };

  const salvar = async () => {
    if (multiOrg && !form.organizacaoId) {
      toast('Selecione a organização.', 'warn');
      return;
    }
    if (!form.nome.trim()) {
      toast('Informe o nome do ministério.', 'warn');
      return;
    }
    const payload = {
      organizacaoId: form.organizacaoId || undefined,
      nome: form.nome,
      descricao: form.descricao || undefined,
      responsavel: form.responsavel || undefined,
      ativo: form.ativo,
    };

    const res = await fetch(editando ? `/api/ministerios/${editando.id}` : '/api/ministerios', {
      method: editando ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast(editando ? 'Ministério atualizado.' : 'Ministério criado.', 'ok');
      setModalOpen(false);
      fetchMinisterios();
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error || 'Erro ao salvar ministério.', 'err');
    }
  };

  const excluir = (m: Ministerio) => {
    confirm(`Inativar o ministério "${m.nome}"? Ele deixa de aparecer no site público.`, async () => {
      const res = await fetch(`/api/ministerios/${m.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Ministério inativado.', 'ok');
        fetchMinisterios();
      } else {
        const d = await res.json().catch(() => ({}));
        toast(d.error || 'Erro ao inativar ministério.', 'err');
      }
    }, { title: 'Inativar ministério', danger: true });
  };

  const campos: ModalField[] = [
    ...(multiOrg
      ? [{
          name: 'organizacaoId',
          label: 'Organização',
          type: 'select' as const,
          value: form.organizacaoId,
          required: true,
          placeholder: 'Selecione a organização',
          options: orgs.map((o) => ({ value: o.id, label: o.nome })),
        }]
      : []),
    { name: 'nome', label: 'Nome', value: form.nome, required: true, full: true },
    { name: 'responsavel', label: 'Responsável', value: form.responsavel },
    { name: 'ativo', label: 'Ativo (visível no site)', type: 'checkbox', value: form.ativo },
    { name: 'descricao', label: 'Descrição', type: 'textarea', value: form.descricao, full: true },
  ];

  const onChange = (name: string, value: string | number | boolean) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const filtrados = ministerios.filter((m) =>
    !search ||
    m.nome.toLowerCase().includes(search.toLowerCase()) ||
    (m.responsavel || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.descricao || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHead
        title="Ministérios"
        subtitle="Grupos e equipes exibidos no site público"
        actions={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm" disabled={orgsLoading}>Novo Ministério</Button>}
      />

      <div className={styles.toolbar}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar ministério..." />
      </div>

      {loading || orgsLoading ? (
        <div className={styles.loadingState}>Carregando ministérios...</div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={<Users size={30} />}
          title="Nenhum ministério encontrado"
          message={search ? 'Tente outro termo de busca.' : 'Cadastre o primeiro ministério da igreja.'}
          action={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Novo Ministério</Button>}
        />
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {filtrados.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                gap: '1rem',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {m.nome}
                  </span>
                  <Badge variant={statusBadgeVariant(m.ativo ? 'ATIVO' : 'INATIVO')}>
                    {m.ativo ? 'ATIVO' : 'INATIVO'}
                  </Badge>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                  {m.responsavel ? `Responsável: ${m.responsavel}` : 'Sem responsável definido'}
                  {m.descricao ? ` · ${m.descricao}` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                <Button variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => openEditar(m)}>
                  Editar
                </Button>
                {m.ativo && (
                  <Button variant="secondary" size="sm" icon={<Trash2 size={13} />} onClick={() => excluir(m)}>
                    Inativar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editando ? 'Editar Ministério' : 'Novo Ministério'}
        description="Ministérios ativos aparecem na seção pública do site"
        fields={campos}
        values={form as unknown as Record<string, string | number | boolean>}
        onChange={onChange}
        onClose={() => setModalOpen(false)}
        onSave={salvar}
        saveLabel={editando ? 'Salvar alterações' : 'Criar ministério'}
      />
    </div>
  );
}
