'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, Send, Archive, RotateCcw, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
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
}

interface DestinoPublicacao {
  id: string;
  publicacaoId: string;
  organizacaoId: string;
  status: string;
  publicadoEm: string | null;
  publicadoPorId: string | null;
  createdAt: string;
  organizacao: Organizacao;
}

interface Publicacao {
  id: string;
  titulo: string;
  conteudo: string;
  tipo: string;
  status: string;
  autorId: string;
  publicadoPorId: string | null;
  publicadoEm: string | null;
  createdAt: string;
  updatedAt: string;
  autor: { id: string; name: string; email: string };
  publicadoPor: { id: string; name: string; email: string } | null;
  destinos: DestinoPublicacao[];
}

const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  PUBLICADA: 'Publicada',
  ARQUIVADA: 'Arquivada',
  PENDENTE: 'Pendente',
  PUBLICADO: 'Publicado',
  DESPUBLICADO: 'Despublicado',
};

const STATUS_VARIANTS: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  RASCUNHO: 'default',
  PUBLICADA: 'success',
  ARQUIVADA: 'default',
  PENDENTE: 'warning',
  PUBLICADO: 'success',
  DESPUBLICADO: 'error',
};

const TIPO_LABELS: Record<string, string> = {
  AVISO: 'Aviso',
  EVENTO: 'Evento',
  COMUNICADO: 'Comunicado',
  ARTIGO: 'Artigo',
};

export default function PublicacoesPage() {
  const { toast, confirm } = useToast();
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [detalhe, setDetalhe] = useState<Publicacao | null>(null);
  const [editando, setEditando] = useState<Publicacao | null>(null);
  const [form, setForm] = useState({
    titulo: '',
    conteudo: '',
    tipo: 'AVISO',
    organizacoesIds: [] as string[],
  });

  const limit = 20;

  const fetchPublicacoes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status: filterStatus,
        tipo: filterTipo,
        page: page.toString(),
        limit: limit.toString(),
      });
      const res = await fetch(`/api/publicacoes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPublicacoes(data.publicacoes || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterTipo, page]);

  const fetchOrganizacoes = useCallback(async () => {
    try {
      const res = await fetch('/api/organizacoes');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.organizacoes || [];
        setOrganizacoes(list);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { fetchPublicacoes(); }, [fetchPublicacoes]);
  useEffect(() => { fetchOrganizacoes(); }, [fetchOrganizacoes]);

  const openNovo = () => {
    setEditando(null);
    setForm({ titulo: '', conteudo: '', tipo: 'AVISO', organizacoesIds: [] });
    setModalOpen(true);
  };

  const openEditar = (p: Publicacao) => {
    setEditando(p);
    setForm({
      titulo: p.titulo,
      conteudo: p.conteudo,
      tipo: p.tipo,
      organizacoesIds: p.destinos.map(d => d.organizacaoId),
    });
    setModalOpen(true);
  };

  const openDetalhes = (p: Publicacao) => {
    setDetalhe(p);
  };

  const salvar = async () => {
    if (!form.titulo.trim() || !form.conteudo.trim()) {
      toast('Preencha título e conteúdo.', 'warn');
      return;
    }
    if (form.organizacoesIds.length === 0) {
      toast('Selecione pelo menos uma organização.', 'warn');
      return;
    }

    const payload = {
      titulo: form.titulo,
      conteudo: form.conteudo,
      tipo: form.tipo,
      organizacoesIds: form.organizacoesIds,
    };

    const url = editando ? `/api/publicacoes/${editando.id}` : '/api/publicacoes';
    const method = editando ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast(editando ? 'Publicação atualizada.' : 'Publicação criada.', 'ok');
      setModalOpen(false);
      fetchPublicacoes();
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error || 'Erro ao salvar publicação.', 'err');
    }
  };

  const excluir = (p: Publicacao) => {
    confirm(`Excluir a publicação "${p.titulo}"?`, async () => {
      const res = await fetch(`/api/publicacoes/${p.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Publicação excluída.', 'ok');
        fetchPublicacoes();
      } else {
        toast('Erro ao excluir publicação.', 'err');
      }
    }, { title: 'Excluir publicação', danger: true });
  };

  const executarAcaoDestino = async (publicacaoId: string, organizacaoId: string, acao: 'publicar' | 'despublicar' | 'arquivar') => {
    const res = await fetch(`/api/publicacoes/${publicacaoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao, organizacaoId }),
    });
    if (res.ok) {
      toast(`Ação "${acao}" executada com sucesso.`, 'ok');
      fetchPublicacoes();
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error || 'Erro ao executar ação.', 'err');
    }
  };

  const campos: ModalField[] = [
    { name: 'titulo', label: 'Título', value: form.titulo, required: true },
    { name: 'conteudo', label: 'Conteúdo', type: 'textarea', value: form.conteudo, required: true, full: true, rows: 8 },
    {
      name: 'tipo',
      label: 'Tipo',
      type: 'select',
      value: form.tipo,
      required: true,
      options: [
        { value: 'AVISO', label: 'Aviso' },
        { value: 'EVENTO', label: 'Evento' },
        { value: 'COMUNICADO', label: 'Comunicado' },
        { value: 'ARTIGO', label: 'Artigo' },
      ],
    },
    {
      name: 'organizacoesIds',
      label: 'Organizações de destino',
      type: 'multiselect',
      value: form.organizacoesIds,
      required: true,
      options: organizacoes.map(o => ({ value: o.id, label: o.nome })),
    },
  ];

  const onChange = (name: string, value: any) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const getStatusGeral = (p: Publicacao) => {
    if (p.destinos.some(d => d.status === 'PUBLICADO')) return 'PUBLICADA';
    if (p.destinos.some(d => d.status === 'PENDENTE')) return 'RASCUNHO';
    if (p.destinos.every(d => d.status === 'ARQUIVADO')) return 'ARQUIVADA';
    if (p.destinos.every(d => d.status === 'DESPUBLICADO')) return 'RASCUNHO';
    return p.status;
  };

  return (
    <div>
      <PageHead
        title="Publicações Centralizadas"
        subtitle="Crie uma vez, publique em múltiplas organizações"
        actions={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Nova Publicação</Button>}
      />

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar publicações..." style={{ minWidth: 280 }} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
            <option value="">Todos os status</option>
            <option value="RASCUNHO">Rascunho</option>
            <option value="PUBLICADA">Publicada</option>
            <option value="ARQUIVADA">Arquivada</option>
          </select>
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
            <option value="">Todos os tipos</option>
            <option value="AVISO">Aviso</option>
            <option value="EVENTO">Evento</option>
            <option value="COMUNICADO">Comunicado</option>
            <option value="ARTIGO">Artigo</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Carregando publicações...</div>
      ) : publicacoes.length === 0 ? (
        <EmptyState
          icon={<Send size={30} />}
          title="Nenhuma publicação encontrada"
          message={search || filterStatus || filterTipo ? 'Tente ajustar os filtros.' : 'Crie a primeira publicação centralizada.'}
          action={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Nova Publicação</Button>}
        />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {publicacoes.map((p) => {
              const statusGeral = getStatusGeral(p);
              const destinosPublicados = p.destinos.filter(d => d.status === 'PUBLICADO').length;
              const destinosTotal = p.destinos.length;

              return (
                <div key={p.id} className={styles.listItem}>
                  <div className={styles.listItemAvatar}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gradient-gold-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Send size={20} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div className={styles.listItemInfo}>
                      <h4>{p.titulo}</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {TIPO_LABELS[p.tipo] || p.tipo} · {p.destinos.length} org(s) · {destinosPublicados}/{destinosTotal} publicado(s)
                        {p.publicadoEm && ` · Publicada em ${new Date(p.publicadoEm).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                  </div>
                  <div className={styles.listItemActions}>
                    <Badge variant={STATUS_VARIANTS[statusGeral] || 'default'}>
                      {STATUS_LABELS[statusGeral] || statusGeral}
                    </Badge>
                    <Button size="sm" variant="secondary" icon={<Eye size={14} />} onClick={() => openDetalhes(p)}>Detalhes</Button>
                    <Button size="sm" variant="secondary" icon={<Pencil size={14} />} onClick={() => openEditar(p)}>Editar</Button>
                    <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => excluir(p)}>Excluir</Button>
                  </div>
                </div>
              );
            })}
          </div>

          {total > limit && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <Button variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} icon={<ChevronLeft size={16} />}>Anterior</Button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', color: 'var(--text-secondary)' }}>
                Página {page} de {Math.ceil(total / limit)}
              </span>
              <Button variant="secondary" onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))} disabled={page >= Math.ceil(total / limit)} icon={<ChevronRight size={16} />}>Próxima</Button>
            </div>
          )}
        </>
      )}

      <Modal
        open={modalOpen}
        title={editando ? 'Editar Publicação' : 'Nova Publicação'}
        description="POST/PUT /api/publicacoes · schema Zod criarPublicacaoSchema"
        fields={campos}
        values={form as unknown as Record<string, string | number | boolean>}
        onChange={onChange}
        onClose={() => setModalOpen(false)}
        onSave={salvar}
        saveLabel={editando ? 'Salvar alterações' : 'Criar publicação'}
      />

      <Modal
        open={!!detalhe}
        title={detalhe ? `Detalhes — ${detalhe.titulo}` : 'Detalhes da publicação'}
        description="Status por organização de destino"
        onClose={() => setDetalhe(null)}
        size="lg"
      >
        {detalhe && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div><p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Título</p><p style={{ fontWeight: 600 }}>{detalhe.titulo}</p></div>
              <div><p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Tipo</p><p style={{ fontWeight: 600 }}>{TIPO_LABELS[detalhe.tipo] || detalhe.tipo}</p></div>
              <div><p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Status Geral</p><Badge variant={STATUS_VARIANTS[getStatusGeral(detalhe)] || 'default'}>{STATUS_LABELS[getStatusGeral(detalhe)] || getStatusGeral(detalhe)}</Badge></div>
              <div><p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Autor</p><p style={{ fontWeight: 600 }}>{detalhe.autor?.name || '—'}</p></div>
              <div><p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Criada em</p><p style={{ fontWeight: 600 }}>{new Date(detalhe.createdAt).toLocaleString('pt-BR')}</p></div>
              <div><p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Publicada em</p><p style={{ fontWeight: 600 }}>{detalhe.publicadoEm ? new Date(detalhe.publicadoEm).toLocaleString('pt-BR') : '—'}</p></div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Destinos por Organização</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {detalhe.destinos.map((d) => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontWeight: 500 }}>{d.organizacao.nome}</span>
                      <Badge variant={STATUS_VARIANTS[d.status] || 'default'}>{STATUS_LABELS[d.status] || d.status}</Badge>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {d.status === 'PENDENTE' && (
                        <Button size="sm" icon={<Send size={14} />} onClick={() => executarAcaoDestino(detalhe.id, d.organizacaoId, 'publicar')}>Publicar</Button>
                      )}
                      {d.status === 'PUBLICADO' && (
                        <Button size="sm" variant="secondary" icon={<RotateCcw size={14} />} onClick={() => executarAcaoDestino(detalhe.id, d.organizacaoId, 'despublicar')}>Despublicar</Button>
                      )}
                      {(d.status === 'PENDENTE' || d.status === 'PUBLICADO') && (
                        <Button size="sm" variant="secondary" icon={<Archive size={14} />} onClick={() => executarAcaoDestino(detalhe.id, d.organizacaoId, 'arquivar')}>Arquivar</Button>
                      )}
                      {d.status === 'DESPUBLICADO' && (
                        <Button size="sm" icon={<Send size={14} />} onClick={() => executarAcaoDestino(detalhe.id, d.organizacaoId, 'publicar')}>Republicar</Button>
                      )}
                      {d.status === 'ARQUIVADO' && (
                        <Button size="sm" variant="secondary" icon={<RotateCcw size={14} />} onClick={() => executarAcaoDestino(detalhe.id, d.organizacaoId, 'publicar')}>Restaurar</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Conteúdo</h4>
              <div style={{ whiteSpace: 'pre-wrap', background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', maxHeight: '300px', overflow: 'auto' }}>
                {detalhe.conteudo}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}