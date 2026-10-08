'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import PageHead from '@/components/ui/PageHead';
import Button from '@/components/ui/Button';
import Badge, { statusBadgeVariant } from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Modal, { ModalField } from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import SearchBar from '@/components/ui/SearchBar';
import { useToast } from '@/components/ui/Toast';
import { formatarDataBR } from '@/lib/datas';
import styles from '@/components/ui/form.module.css';
import { useOrganizacoes } from '@/hooks/useOrganizacoes';

interface Membro {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  status: string;
  dataEntrada: string | null;
  congregacao: { id: string; nome: string } | null;
  ministerio: { nome: string } | null;
}

function dataBR(iso?: string | null) {
  if (!iso) return '—';
  return formatarDataBR(iso);
}

export default function MembrosPage() {
  const { toast, confirm } = useToast();
  const { orgs, loading: orgsLoading, multiOrg } = useOrganizacoes();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Membro | null>(null);
  const [form, setForm] = useState({
    organizacaoId: '',
    nome: '',
    email: '',
    telefone: '',
    congregacao: '',
    status: 'ATIVO',
    dataEntrada: '',
  });

  const fetchMembros = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    fetch(`/api/membros?${params}`)
      .then((r) => r.json())
      .then((d) => setMembros(d.membros || []))
      .catch(() => setMembros([]))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchMembros(); }, [fetchMembros]);

  const openNovo = () => {
    setEditando(null);
    setForm({ organizacaoId: orgs.length === 1 ? orgs[0].id : '', nome: '', email: '', telefone: '', congregacao: '', status: 'ATIVO', dataEntrada: '' });
    setModalOpen(true);
  };

  const openEditar = (m: Membro) => {
    setEditando(m);
    setForm({
      organizacaoId: (m as unknown as { organizacaoId?: string }).organizacaoId || (orgs.length === 1 ? orgs[0].id : ''),
      nome: m.nome,
      email: m.email || '',
      telefone: m.telefone || '',
      congregacao: m.congregacao?.nome || '',
      status: m.status,
      dataEntrada: m.dataEntrada ? m.dataEntrada.slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  const salvar = async () => {
    if (multiOrg && !form.organizacaoId) {
      toast('Selecione a organização.', 'warn');
      return;
    }
    if (!form.nome.trim()) {
      toast('Preencha o nome.', 'warn');
      return;
    }
    const payload = {
      organizacaoId: form.organizacaoId || undefined,
      nome: form.nome,
      email: form.email || null,
      telefone: form.telefone || null,
      congregacao: form.congregacao || undefined,
      status: form.status,
      dataEntrada: form.dataEntrada || undefined,
    };

    const res = await fetch(editando ? `/api/membros/${editando.id}` : '/api/membros', {
      method: editando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast(editando ? 'Membro atualizado.' : 'Membro criado.', 'ok');
      setModalOpen(false);
      fetchMembros();
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error || 'Erro ao salvar membro.', 'err');
    }
  };

  const excluir = (m: Membro) => {
    confirm(`Excluir o membro "${m.nome}"?`, async () => {
      const res = await fetch(`/api/membros/${m.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Membro excluído.', 'ok');
        fetchMembros();
      } else {
        toast('Erro ao excluir membro.', 'err');
      }
    }, { title: 'Excluir membro', danger: true });
  };

  const campos: ModalField[] = [
    ...(multiOrg
      ? [{
          name: 'organizacaoId',
          label: 'Organização',
          type: 'select' as const,
          value: form.organizacaoId,
          required: true,
          options: orgs.map((o) => ({ value: o.id, label: o.nome })),
        }]
      : []),
    { name: 'nome', label: 'Nome completo', value: form.nome, required: true, full: true },
    { name: 'email', label: 'E-mail', type: 'email', value: form.email },
    { name: 'telefone', label: 'Telefone', type: 'tel', value: form.telefone },
    { name: 'congregacao', label: 'Congregação', value: form.congregacao, placeholder: 'Ex: Matriz' },
    {
      name: 'status', label: 'Status', type: 'select', value: form.status,
      options: [
        { value: 'ATIVO', label: 'Ativo' },
        { value: 'INATIVO', label: 'Inativo' },
        { value: 'TRANSFERIDO', label: 'Transferido' },
        { value: 'FALECIDO', label: 'Falecido' },
      ],
    },
    { name: 'dataEntrada', label: 'Data de entrada', type: 'date', value: form.dataEntrada },
  ];

  const onChange = (name: string, value: string | number | boolean) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  return (
    <div>
      <PageHead
        title="Gestão de Membros"
        subtitle="Escopo por organização e congregação · validação Zod · soft delete por status"
        actions={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Novo Membro</Button>}
      />

      <div className={styles.toolbar}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar membro..." />
      </div>

      {loading ? (
        <div className={styles.loadingState}>Carregando membros...</div>
      ) : membros.length === 0 ? (
        <EmptyState
          icon={<Users size={30} />}
          title="Nenhum membro encontrado"
          message={search ? 'Tente outro termo de busca.' : 'Cadastre o primeiro membro da comunidade.'}
          action={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Novo Membro</Button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {membros.map((m) => (
            <div key={m.id} className={styles.listItem}>
              <div className={styles.listItemAvatar}>
                <Avatar name={m.nome} />
                <div className={styles.listItemInfo}>
                  <h4>{m.nome}</h4>
                  <p>
                    {m.email || 'Sem email'}
                    {m.telefone && ` · ${m.telefone}`}
                    {' · '}{m.congregacao?.nome || 'Sem congregação'}
                    {' · desde '}{dataBR(m.dataEntrada)}
                  </p>
                </div>
              </div>
              <div className={styles.listItemActions}>
                <Badge variant={statusBadgeVariant(m.status)}>{m.status}</Badge>
                <Button size="sm" variant="secondary" icon={<Pencil size={14} />} onClick={() => openEditar(m)}>Editar</Button>
                <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => excluir(m)}>Excluir</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editando ? 'Editar Membro' : 'Novo Membro'}
        description="POST /api/membros · schema Zod membroSchema · organização via resolveTargetOrgId"
        fields={campos}
        values={form as unknown as Record<string, string | number | boolean>}
        onChange={onChange}
        onClose={() => setModalOpen(false)}
        onSave={salvar}
        saveLabel={editando ? 'Salvar alterações' : 'Criar membro'}
      />
    </div>
  );
}
