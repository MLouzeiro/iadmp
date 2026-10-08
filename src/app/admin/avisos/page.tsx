'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Bell, Search } from 'lucide-react';
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

interface Aviso {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string | null;
  urgencia: string;
  situacaoAviso: string;
  publicarSite: boolean;
  mostrarPainel: boolean;
  destaque: boolean;
  comecaEm: string;
  terminaEm: string | null;
  publicoAlvo: string | null;
  congregacao?: { id: string; nome: string } | null;
}

const urgenciaVariant = (u: string) =>
  u === 'URGENTE' ? 'err' : u === 'ALTA' ? 'warn' : u === 'BAIXA' ? 'mut' : 'info';

function dataBR(iso?: string | null) {
  if (!iso) return '—';
  return formatarDataBR(iso);
}

export default function AvisosPage() {
  const { toast, confirm } = useToast();
  const { orgs, multiOrg } = useOrganizacoes();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Aviso | null>(null);
  const [form, setForm] = useState({
    organizacaoId: '',
    titulo: '',
    descricao: '',
    categoria: '',
    urgencia: 'NORMAL',
    situacaoAviso: 'ATIVO',
    publicarSite: false,
    mostrarPainel: true,
    destaque: false,
    terminaEm: '',
    publicoAlvo: '',
  });

  const fetchAvisos = useCallback(() => {
    fetch('/api/avisos')
      .then((r) => r.json())
      .then((d) => setAvisos(Array.isArray(d) ? d : d.avisos || []))
      .catch(() => setAvisos([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAvisos(); }, [fetchAvisos]);

  const openNovo = () => {
    setEditando(null);
    setForm({
      organizacaoId: orgs.length === 1 ? orgs[0].id : '', titulo: '', descricao: '', categoria: '', urgencia: 'NORMAL', situacaoAviso: 'ATIVO',
      publicarSite: false, mostrarPainel: true, destaque: false, terminaEm: '', publicoAlvo: '',
    });
    setModalOpen(true);
  };

  const openEditar = (a: Aviso) => {
    setEditando(a);
    setForm({
      organizacaoId: (a as unknown as { organizacaoId?: string }).organizacaoId || (orgs.length === 1 ? orgs[0].id : ''),
      titulo: a.titulo,
      descricao: a.descricao,
      categoria: a.categoria || '',
      urgencia: a.urgencia,
      situacaoAviso: a.situacaoAviso,
      publicarSite: a.publicarSite,
      mostrarPainel: a.mostrarPainel,
      destaque: a.destaque,
      terminaEm: a.terminaEm ? a.terminaEm.slice(0, 10) : '',
      publicoAlvo: a.publicoAlvo || '',
    });
    setModalOpen(true);
  };

  const salvar = async () => {
    if (multiOrg && !form.organizacaoId) {
      toast('Selecione a organização.', 'warn');
      return;
    }
    if (!form.titulo.trim() || !form.descricao.trim()) {
      toast('Preencha título e descrição.', 'warn');
      return;
    }
    const payload = {
      organizacaoId: form.organizacaoId || undefined,
      titulo: form.titulo,
      descricao: form.descricao,
      categoria: form.categoria || null,
      urgencia: form.urgencia,
      situacaoAviso: form.situacaoAviso,
      publicarSite: form.publicarSite,
      mostrarPainel: form.mostrarPainel,
      destaque: form.destaque,
      dataFim: form.terminaEm || null,
      publicoAlvo: form.publicoAlvo || null,
    };

    const res = await fetch(editando ? `/api/avisos/${editando.id}` : '/api/avisos', {
      method: editando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast(editando ? 'Aviso atualizado.' : 'Aviso criado.', 'ok');
      setModalOpen(false);
      fetchAvisos();
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error || 'Erro ao salvar aviso.', 'err');
    }
  };

  const excluir = (a: Aviso) => {
    confirm(`Excluir o aviso "${a.titulo}"?`, async () => {
      const res = await fetch(`/api/avisos/${a.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Aviso excluído.', 'ok');
        fetchAvisos();
      } else {
        toast('Erro ao excluir aviso.', 'err');
      }
    }, { title: 'Excluir aviso', danger: true });
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
    { name: 'titulo', label: 'Título', value: form.titulo, required: true, full: true },
    { name: 'descricao', label: 'Descrição', type: 'textarea', value: form.descricao, required: true, full: true },
    { name: 'categoria', label: 'Categoria', value: form.categoria, placeholder: 'Ex: Culto, Congresso...' },
    {
      name: 'urgencia', label: 'Urgência', type: 'select', value: form.urgencia,
      options: [
        { value: 'BAIXA', label: 'Baixa' },
        { value: 'NORMAL', label: 'Normal' },
        { value: 'ALTA', label: 'Alta' },
        { value: 'URGENTE', label: 'Urgente' },
      ],
    },
    {
      name: 'situacaoAviso', label: 'Situação', type: 'select', value: form.situacaoAviso,
      options: [
        { value: 'ATIVO', label: 'Ativo' },
        { value: 'INATIVO', label: 'Inativo' },
        { value: 'EXPIRADO', label: 'Expirado' },
      ],
    },
    { name: 'terminaEm', label: 'Válido até', type: 'date', value: form.terminaEm },
    { name: 'publicoAlvo', label: 'Público-alvo', value: form.publicoAlvo, placeholder: 'Ex: Jovens, Líderes...' },
    { name: 'publicarSite', label: 'Publicar no site', type: 'checkbox', value: form.publicarSite, placeholder: 'Exibir no site público' },
    { name: 'mostrarPainel', label: 'Mostrar no painel', type: 'checkbox', value: form.mostrarPainel, placeholder: 'Exibir no painel admin' },
    { name: 'destaque', label: 'Destaque', type: 'checkbox', value: form.destaque, placeholder: 'Marcar como destaque' },
  ];

  const onChange = (name: string, value: string | number | boolean) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const filtrados = avisos.filter((a) =>
    !search ||
    a.titulo.toLowerCase().includes(search.toLowerCase()) ||
    a.descricao.toLowerCase().includes(search.toLowerCase()) ||
    (a.categoria || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHead
        title="Avisos"
        subtitle="Comunicados internos e publicação no site · urgência · validade"
        actions={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Novo Aviso</Button>}
      />

      <div className={styles.toolbar}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar aviso..." />
      </div>

      {loading ? (
        <div className={styles.loadingState}>Carregando avisos...</div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={<Bell size={30} />}
          title="Nenhum aviso encontrado"
          message={search ? 'Tente outro termo de busca.' : 'Crie o primeiro aviso para comunicar sua comunidade.'}
          action={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Novo Aviso</Button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtrados.map((a) => (
            <div key={a.id} className={styles.listItem}>
              <div className={styles.listItemAvatar}>
                <Avatar name={a.titulo} icon={<Bell size={18} />} />
                <div className={styles.listItemInfo}>
                  <h4>{a.titulo}</h4>
                  <p>
                    {a.descricao.slice(0, 90)}{a.descricao.length > 90 ? '…' : ''}
                    {' · válido até '}{dataBR(a.terminaEm)}
                  </p>
                </div>
              </div>
              <div className={styles.listItemActions}>
                <Badge variant={urgenciaVariant(a.urgencia)}>{a.urgencia}</Badge>
                <Badge variant={statusBadgeVariant(a.situacaoAviso)}>{a.situacaoAviso}</Badge>
                {a.publicarSite && <Badge variant="gold">SITE</Badge>}
                {a.destaque && <Badge variant="warn">DESTAQUE</Badge>}
                <Button size="sm" variant="secondary" icon={<Pencil size={14} />} onClick={() => openEditar(a)}>Editar</Button>
                <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => excluir(a)}>Excluir</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editando ? 'Editar Aviso' : 'Novo Aviso'}
        description="POST /api/avisos · schema Zod avisoSchema · escopo por organização"
        fields={campos}
        values={form as unknown as Record<string, string | number | boolean>}
        onChange={onChange}
        onClose={() => setModalOpen(false)}
        onSave={salvar}
        saveLabel={editando ? 'Salvar alterações' : 'Criar aviso'}
      />
    </div>
  );
}
