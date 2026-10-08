'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Lightbulb, Users } from 'lucide-react';
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

interface Oportunidade {
  id: string;
  titulo: string;
  descricao: string;
  generoOportunidade: string;
  responsavel: string | null;
  prazo: string | null;
  vagas: number | null;
  abrirOportunidade: string;
  observacoes: string | null;
  congregacao?: { id: string; nome: string } | null;
}

function dataBR(iso?: string | null) {
  if (!iso) return '—';
  return formatarDataBR(iso);
}

export default function OportunidadesPage() {
  const { toast, confirm } = useToast();
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Oportunidade | null>(null);
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    generoOportunidade: 'VOLUNTARIADO',
    responsavel: '',
    prazo: '',
    vagas: '',
    abrirOportunidade: 'ATIVA',
    observacoes: '',
  });

  const fetchOportunidades = useCallback(() => {
    fetch('/api/oportunidades')
      .then((r) => r.json())
      .then((d) => setOportunidades(Array.isArray(d) ? d : d.oportunidades || []))
      .catch(() => setOportunidades([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOportunidades(); }, [fetchOportunidades]);

  const openNovo = () => {
    setEditando(null);
    setForm({ titulo: '', descricao: '', generoOportunidade: 'VOLUNTARIADO', responsavel: '', prazo: '', vagas: '', abrirOportunidade: 'ATIVA', observacoes: '' });
    setModalOpen(true);
  };

  const openEditar = (o: Oportunidade) => {
    setEditando(o);
    setForm({
      titulo: o.titulo,
      descricao: o.descricao,
      generoOportunidade: o.generoOportunidade,
      responsavel: o.responsavel || '',
      prazo: o.prazo ? o.prazo.slice(0, 10) : '',
      vagas: o.vagas !== null ? String(o.vagas) : '',
      abrirOportunidade: o.abrirOportunidade,
      observacoes: o.observacoes || '',
    });
    setModalOpen(true);
  };

  const salvar = async () => {
    if (!form.titulo.trim() || !form.descricao.trim()) {
      toast('Preencha título e descrição.', 'warn');
      return;
    }
    const payload = {
      titulo: form.titulo,
      descricao: form.descricao,
      generoOportunidade: form.generoOportunidade,
      responsavel: form.responsavel || undefined,
      prazo: form.prazo || undefined,
      vagas: form.vagas ? parseInt(form.vagas) : undefined,
      abrirOportunidade: form.abrirOportunidade,
      observacoes: form.observacoes || undefined,
    };

    const res = await fetch(editando ? `/api/oportunidades/${editando.id}` : '/api/oportunidades', {
      method: editando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast(editando ? 'Oportunidade atualizada.' : 'Oportunidade criada.', 'ok');
      setModalOpen(false);
      fetchOportunidades();
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error || 'Erro ao salvar oportunidade.', 'err');
    }
  };

  const excluir = (o: Oportunidade) => {
    confirm(`Excluir a oportunidade "${o.titulo}"?`, async () => {
      const res = await fetch(`/api/oportunidades/${o.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Oportunidade excluída.', 'ok');
        fetchOportunidades();
      } else {
        toast('Erro ao excluir oportunidade.', 'err');
      }
    }, { title: 'Excluir oportunidade', danger: true });
  };

  const campos: ModalField[] = [
    { name: 'titulo', label: 'Título', value: form.titulo, required: true, full: true },
    { name: 'descricao', label: 'Descrição', type: 'textarea', value: form.descricao, required: true, full: true },
    {
      name: 'generoOportunidade', label: 'Tipo', type: 'select', value: form.generoOportunidade,
      options: [
        { value: 'VOLUNTARIADO', label: 'Voluntariado' },
        { value: 'MINISTERIO', label: 'Ministério' },
        { value: 'TRABALHO', label: 'Trabalho' },
        { value: 'OUTRO', label: 'Outro' },
      ],
    },
    {
      name: 'abrirOportunidade', label: 'Status', type: 'select', value: form.abrirOportunidade,
      options: [
        { value: 'ATIVA', label: 'Ativa' },
        { value: 'ENCERRADA', label: 'Encerrada' },
        { value: 'SUSPENSA', label: 'Suspensa' },
      ],
    },
    { name: 'responsavel', label: 'Responsável', value: form.responsavel },
    { name: 'prazo', label: 'Prazo', type: 'date', value: form.prazo },
    { name: 'vagas', label: 'Vagas', type: 'number', value: form.vagas, min: 0 },
    { name: 'observacoes', label: 'Observações', type: 'textarea', value: form.observacoes, full: true },
  ];

  const onChange = (name: string, value: string | number | boolean) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const filtrados = oportunidades.filter((o) =>
    !search ||
    o.titulo.toLowerCase().includes(search.toLowerCase()) ||
    o.descricao.toLowerCase().includes(search.toLowerCase()) ||
    (o.responsavel || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHead
        title="Oportunidades"
        subtitle="Vagas de voluntariado e ministérios · prazos · responsáveis"
        actions={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Nova Oportunidade</Button>}
      />

      <div className={styles.toolbar}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar oportunidade..." />
      </div>

      {loading ? (
        <div className={styles.loadingState}>Carregando oportunidades...</div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={<Lightbulb size={30} />}
          title="Nenhuma oportunidade encontrada"
          message={search ? 'Tente outro termo de busca.' : 'Publique vagas para engajar sua comunidade.'}
          action={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Nova Oportunidade</Button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtrados.map((o) => (
            <div key={o.id} className={styles.listItem}>
              <div className={styles.listItemAvatar}>
                <Avatar name={o.titulo} icon={<Lightbulb size={18} />} />
                <div className={styles.listItemInfo}>
                  <h4>{o.titulo}</h4>
                  <p>
                    {o.descricao.slice(0, 80)}{o.descricao.length > 80 ? '…' : ''}
                    {' · prazo '}{dataBR(o.prazo)}
                    {o.vagas !== null && ` · ${o.vagas} vagas`}
                  </p>
                </div>
              </div>
              <div className={styles.listItemActions}>
                <Badge variant={statusBadgeVariant(o.abrirOportunidade)}>{o.abrirOportunidade}</Badge>
                {o.vagas !== null && <Badge variant="info"><Users size={11} /> {o.vagas}</Badge>}
                <Button size="sm" variant="secondary" icon={<Pencil size={14} />} onClick={() => openEditar(o)}>Editar</Button>
                <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => excluir(o)}>Excluir</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editando ? 'Editar Oportunidade' : 'Nova Oportunidade'}
        description="POST /api/oportunidades · vagas de voluntariado e ministérios"
        fields={campos}
        values={form as unknown as Record<string, string | number | boolean>}
        onChange={onChange}
        onClose={() => setModalOpen(false)}
        onSave={salvar}
        saveLabel={editando ? 'Salvar alterações' : 'Criar oportunidade'}
      />
    </div>
  );
}
