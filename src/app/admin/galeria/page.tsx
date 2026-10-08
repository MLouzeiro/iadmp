'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Images, Image as ImageIcon } from 'lucide-react';
import PageHead from '@/components/ui/PageHead';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal, { ModalField } from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import SearchBar from '@/components/ui/SearchBar';
import Lightbox from '@/components/ui/Lightbox';
import { useToast } from '@/components/ui/Toast';
import styles from '@/components/ui/form.module.css';
import { useOrganizacoes } from '@/hooks/useOrganizacoes';

interface GaleriaItem {
  id: string;
  titulo: string | null;
  descricao: string | null;
  url: string;
  classArquivo: string;
  ordem: number;
  album?: { id: string; nome: string } | null;
  evento?: { id: string; nome: string } | null;
}

export default function GaleriaAdminPage() {
  const { toast, confirm } = useToast();
  const { orgs, multiOrg } = useOrganizacoes();
  const [itens, setItens] = useState<GaleriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<GaleriaItem | null>(null);
  const [lightbox, setLightbox] = useState<GaleriaItem | null>(null);
  const [form, setForm] = useState({
    organizacaoId: '',
    titulo: '',
    descricao: '',
    url: '',
    classArquivo: 'FOTO',
    ordem: '',
  });

  const fetchItens = useCallback(() => {
    fetch('/api/galeria')
      .then((r) => r.json())
      .then((d) => setItens(Array.isArray(d) ? d : d.itens || []))
      .catch(() => setItens([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchItens(); }, [fetchItens]);

  const openNovo = () => {
    setEditando(null);
    setForm({ organizacaoId: orgs.length === 1 ? orgs[0].id : '', titulo: '', descricao: '', url: '', classArquivo: 'FOTO', ordem: '' });
    setModalOpen(true);
  };

  const openEditar = (g: GaleriaItem) => {
    setEditando(g);
    setForm({
      organizacaoId: (g as unknown as { organizacaoId?: string }).organizacaoId || (orgs.length === 1 ? orgs[0].id : ''),
      titulo: g.titulo || '',
      descricao: g.descricao || '',
      url: g.url,
      classArquivo: g.classArquivo,
      ordem: String(g.ordem),
    });
    setModalOpen(true);
  };

  const salvar = async () => {
    if (!form.url.trim()) {
      toast('Informe a URL da imagem.', 'warn');
      return;
    }
    const payload = {
      organizacaoId: form.organizacaoId || undefined,
      titulo: form.titulo || undefined,
      descricao: form.descricao || undefined,
      url: form.url,
      classArquivo: form.classArquivo,
      ordem: form.ordem ? parseInt(form.ordem) : 0,
    };

    const res = await fetch(editando ? `/api/galeria/${editando.id}` : '/api/galeria', {
      method: editando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast(editando ? 'Item atualizado.' : 'Item adicionado.', 'ok');
      setModalOpen(false);
      fetchItens();
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error || 'Erro ao salvar item.', 'err');
    }
  };

  const excluir = (g: GaleriaItem) => {
    confirm(`Excluir o item "${g.titulo || g.url}"?`, async () => {
      const res = await fetch(`/api/galeria/${g.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Item excluído.', 'ok');
        fetchItens();
      } else {
        toast('Erro ao excluir item.', 'err');
      }
    }, { title: 'Excluir item', danger: true });
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
    { name: 'url', label: 'URL da imagem', value: form.url, required: true, full: true, placeholder: '/images/... ou https://...' },
    { name: 'descricao', label: 'Descrição', type: 'textarea', value: form.descricao, full: true },
    {
      name: 'classArquivo', label: 'Tipo', type: 'select', value: form.classArquivo,
      options: [
        { value: 'FOTO', label: 'Foto' },
        { value: 'VIDEO', label: 'Vídeo' },
        { value: 'DOCUMENTO', label: 'Documento' },
      ],
    },
    { name: 'ordem', label: 'Ordem', type: 'number', value: form.ordem, min: 0 },
  ];

  const onChange = (name: string, value: string | number | boolean) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const filtrados = itens.filter((g) =>
    !search ||
    (g.titulo || '').toLowerCase().includes(search.toLowerCase()) ||
    (g.descricao || '').toLowerCase().includes(search.toLowerCase()) ||
    g.url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHead
        title="Galeria"
        subtitle="Álbuns e itens · vinculação com eventos · upload de imagens"
        actions={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Novo Item</Button>}
      />

      <div className={styles.toolbar}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar na galeria..." />
      </div>

      {loading ? (
        <div className={styles.loadingState}>Carregando galeria...</div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={<Images size={30} />}
          title="Nenhum item encontrado"
          message={search ? 'Tente outro termo de busca.' : 'Adicione imagens à galeria da igreja.'}
          action={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Novo Item</Button>}
        />
      ) : (
        <div className="gallery-grid">
          {filtrados.map((g) => (
            <div key={g.id} className="gallery-item" onClick={() => setLightbox(g)}>
              <img src={g.url} alt={g.titulo || 'Imagem'} loading="lazy" />
              <div className="overlay">
                <span>{g.titulo || g.url}</span>
              </div>
              <div
                style={{
                  position: 'absolute', top: '0.55rem', right: '0.55rem',
                  display: 'flex', gap: '0.35rem', zIndex: 2,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Badge variant="gold">{g.classArquivo}</Badge>
                <button
                  type="button"
                  onClick={() => openEditar(g)}
                  style={{
                    width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                    color: 'var(--text-primary)', cursor: 'pointer', display: 'grid', placeItems: 'center',
                  }}
                  title="Editar"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => excluir(g)}
                  style={{
                    width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(231,76,60,.3)', background: 'rgba(231,76,60,.15)',
                    color: '#ff8a80', cursor: 'pointer', display: 'grid', placeItems: 'center',
                  }}
                  title="Excluir"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Lightbox open={!!lightbox} title={lightbox?.titulo || 'Imagem'} onClose={() => setLightbox(null)}>
        {lightbox && <img src={lightbox.url} alt={lightbox.titulo || 'Imagem'} />}
      </Lightbox>

      <Modal
        open={modalOpen}
        title={editando ? 'Editar Item' : 'Novo Item'}
        description="POST /api/galeria · álbum, evento e classificação do arquivo"
        fields={campos}
        values={form as unknown as Record<string, string | number | boolean>}
        onChange={onChange}
        onClose={() => setModalOpen(false)}
        onSave={salvar}
        saveLabel={editando ? 'Salvar alterações' : 'Adicionar item'}
      />
    </div>
  );
}
