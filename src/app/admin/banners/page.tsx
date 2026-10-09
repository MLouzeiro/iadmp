'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Images } from 'lucide-react';
import PageHead from '@/components/ui/PageHead';
import Button from '@/components/ui/Button';
import Badge, { statusBadgeVariant } from '@/components/ui/Badge';
import Modal, { ModalField } from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import SearchBar from '@/components/ui/SearchBar';
import { useToast } from '@/components/ui/Toast';
import styles from '@/components/ui/form.module.css';
import { useOrganizacoes } from '@/hooks/useOrganizacoes';

interface Banner {
  id: string;
  titulo: string | null;
  imagemUrl: string;
  tipo: string;
  link: string | null;
  ordem: number;
  ativo: boolean;
  dataInicio: string | null;
  dataFim: string | null;
  organizacaoId?: string;
}

function paraInputDate(valor: string | null | undefined): string {
  if (!valor) return '';
  return valor.slice(0, 10);
}

export default function BannersAdminPage() {
  const { toast, confirm } = useToast();
  const { orgs, loading: orgsLoading, multiOrg } = useOrganizacoes();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Banner | null>(null);
  const [form, setForm] = useState({
    organizacaoId: '',
    titulo: '',
    imagemUrl: '',
    tipo: 'BANNER',
    link: '',
    ordem: '',
    ativo: true,
    dataInicio: '',
    dataFim: '',
  });

  const fetchBanners = useCallback(() => {
    fetch('/api/banners')
      .then((r) => r.json())
      .then((d) => setBanners(Array.isArray(d) ? d : []))
      .catch(() => setBanners([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const openNovo = () => {
    setEditando(null);
    setForm({
      organizacaoId: orgs.length === 1 ? orgs[0].id : '',
      titulo: '',
      imagemUrl: '',
      tipo: 'BANNER',
      link: '',
      ordem: '',
      ativo: true,
      dataInicio: '',
      dataFim: '',
    });
    setModalOpen(true);
  };

  const openEditar = (b: Banner) => {
    setEditando(b);
    setForm({
      organizacaoId: b.organizacaoId || (orgs.length === 1 ? orgs[0].id : ''),
      titulo: b.titulo || '',
      imagemUrl: b.imagemUrl,
      tipo: b.tipo,
      link: b.link || '',
      ordem: String(b.ordem),
      ativo: b.ativo,
      dataInicio: paraInputDate(b.dataInicio),
      dataFim: paraInputDate(b.dataFim),
    });
    setModalOpen(true);
  };

  const salvar = async () => {
    if (!form.imagemUrl.trim()) {
      toast('Informe a URL da imagem.', 'warn');
      return;
    }
    const payload = {
      organizacaoId: form.organizacaoId || undefined,
      titulo: form.titulo || undefined,
      imagemUrl: form.imagemUrl,
      tipo: form.tipo,
      link: form.link || undefined,
      ordem: form.ordem ? parseInt(form.ordem, 10) : 0,
      ativo: form.ativo,
      dataInicio: form.dataInicio || undefined,
      dataFim: form.dataFim || undefined,
    };

    const res = await fetch(editando ? `/api/banners/${editando.id}` : '/api/banners', {
      method: editando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast(editando ? 'Banner atualizado.' : 'Banner criado.', 'ok');
      setModalOpen(false);
      fetchBanners();
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error || 'Erro ao salvar banner.', 'err');
    }
  };

  const excluir = (b: Banner) => {
    confirm(`Excluir o banner "${b.titulo || b.imagemUrl}"?`, async () => {
      const res = await fetch(`/api/banners/${b.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Banner excluído.', 'ok');
        fetchBanners();
      } else {
        toast('Erro ao excluir banner.', 'err');
      }
    }, { title: 'Excluir banner', danger: true });
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
    { name: 'titulo', label: 'Título', value: form.titulo, full: true },
    { name: 'imagemUrl', label: 'URL da imagem', value: form.imagemUrl, required: true, full: true, placeholder: '/images/... ou https://...' },
    {
      name: 'tipo', label: 'Tipo', type: 'select', value: form.tipo,
      options: [
        { value: 'BANNER', label: 'Banner (horizontal)' },
        { value: 'FLYER', label: 'Flyer (vertical)' },
      ],
    },
    { name: 'ordem', label: 'Ordem', type: 'number', value: form.ordem, min: 0 },
    { name: 'link', label: 'Link ao clicar (opcional)', value: form.link, full: true, placeholder: 'https://... ou /eventos' },
    { name: 'dataInicio', label: 'Exibir a partir de', type: 'date', value: form.dataInicio },
    { name: 'dataFim', label: 'Exibir até', type: 'date', value: form.dataFim },
    { name: 'ativo', label: 'Ativo (visível no site)', type: 'checkbox', value: form.ativo },
  ];

  const onChange = (name: string, value: string | number | boolean) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const filtrados = banners.filter((b) =>
    !search ||
    (b.titulo || '').toLowerCase().includes(search.toLowerCase()) ||
    b.imagemUrl.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHead
        title="Banners e Flyers"
        subtitle="Carrossel interativo no topo do site público"
        actions={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm" disabled={orgsLoading}>Novo Banner</Button>}
      />

      <div className={styles.toolbar}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar banner..." />
      </div>

      {loading ? (
        <div className={styles.loadingState}>Carregando banners...</div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={<Images size={30} />}
          title="Nenhum banner encontrado"
          message={search ? 'Tente outro termo de busca.' : 'Adicione banners ou flyers para exibir no topo do site.'}
          action={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Novo Banner</Button>}
        />
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {filtrados.map((b) => (
            <div
              key={b.id}
              style={{
                display: 'flex',
                gap: '1rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                alignItems: 'center',
              }}
            >
              <img
                src={b.imagemUrl}
                alt={b.titulo || 'Banner'}
                style={{
                  width: '120px',
                  height: '68px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {b.titulo || 'Sem título'}
                  </span>
                  <Badge variant="gold">{b.tipo}</Badge>
                  <Badge variant={statusBadgeVariant(b.ativo ? 'ATIVO' : 'INATIVO')}>
                    {b.ativo ? 'ATIVO' : 'INATIVO'}
                  </Badge>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.imagemUrl}
                  {' · '}Ordem {b.ordem}
                  {b.dataInicio ? ` · Desde ${paraInputDate(b.dataInicio)}` : ''}
                  {b.dataFim ? ` · Até ${paraInputDate(b.dataFim)}` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                <Button variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => openEditar(b)}>
                  Editar
                </Button>
                <Button variant="secondary" size="sm" icon={<Trash2 size={13} />} onClick={() => excluir(b)}>
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editando ? 'Editar Banner' : 'Novo Banner'}
        description="Exibido no carrossel interativo no topo do site público"
        fields={campos}
        values={form as unknown as Record<string, string | number | boolean>}
        onChange={onChange}
        onClose={() => setModalOpen(false)}
        onSave={salvar}
        saveLabel={editando ? 'Salvar alterações' : 'Criar banner'}
      />
    </div>
  );
}
