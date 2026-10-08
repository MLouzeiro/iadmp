'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Tag, Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal, { ModalField } from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import styles from '@/components/ui/form.module.css';

export interface CategoriaFinanceira {
  id: string;
  nome: string;
  genero: string;
  descricao: string | null;
  ativo: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onChanged?: () => void;
}

export default function CategoriasManager({ open, onClose, onChanged }: Props) {
  const { toast, confirm } = useToast();
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<CategoriaFinanceira | null>(null);
  const [form, setForm] = useState({ nome: '', genero: 'ENTRADA', descricao: '' });

  const fetchCategorias = useCallback(() => {
    fetch('/api/financeiro/categorias')
      .then((r) => r.json())
      .then((d) => setCategorias(Array.isArray(d) ? d : []))
      .catch(() => setCategorias([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (open) fetchCategorias();
  }, [open, fetchCategorias]);

  const openNovo = () => {
    setEditando(null);
    setForm({ nome: '', genero: 'ENTRADA', descricao: '' });
    setModalOpen(true);
  };

  const openEditar = (c: CategoriaFinanceira) => {
    setEditando(c);
    setForm({ nome: c.nome, genero: c.genero, descricao: c.descricao || '' });
    setModalOpen(true);
  };

  const salvar = async () => {
    if (!form.nome.trim()) {
      toast('Informe o nome da categoria.', 'warn');
      return;
    }
    const res = await fetch(editando ? `/api/financeiro/categorias/${editando.id}` : '/api/financeiro/categorias', {
      method: editando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast(editando ? 'Categoria atualizada.' : 'Categoria criada.', 'ok');
      setModalOpen(false);
      fetchCategorias();
      onChanged?.();
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error || 'Erro ao salvar categoria.', 'err');
    }
  };

  const alternarAtivo = async (c: CategoriaFinanceira) => {
    const res = await fetch(`/api/financeiro/categorias/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !c.ativo }),
    });
    if (res.ok) {
      toast(c.ativo ? 'Categoria desativada.' : 'Categoria ativada.', 'ok');
      fetchCategorias();
      onChanged?.();
    }
  };

  const excluir = (c: CategoriaFinanceira) => {
    confirm(`Excluir a categoria "${c.nome}"?`, async () => {
      const res = await fetch(`/api/financeiro/categorias/${c.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Categoria excluída.', 'ok');
        fetchCategorias();
        onChanged?.();
      } else {
        const d = await res.json().catch(() => ({}));
        toast(d.error || 'Erro ao excluir categoria.', 'err');
      }
    }, { title: 'Excluir categoria', danger: true });
  };

  const campos: ModalField[] = [
    { name: 'nome', label: 'Nome', value: form.nome, required: true, full: true, placeholder: 'Ex: Oferta de Missões' },
    {
      name: 'genero', label: 'Gênero', type: 'select', value: form.genero,
      options: [
        { value: 'ENTRADA', label: 'Entrada' },
        { value: 'SAIDA', label: 'Saída' },
      ],
    },
    { name: 'descricao', label: 'Descrição', value: form.descricao, full: true, placeholder: 'Opcional' },
  ];

  return (
    <Modal
      open={open}
      title="Gerenciar categorias financeiras"
      description="Categorias detalhadas por organização · usadas em lançamentos e indicadores"
      onClose={onClose}
      saveLabel="Fechar"
      onSave={onClose}
    >
      <div style={{ marginBottom: '1.15rem' }}>
        <Button icon={<Plus size={15} />} onClick={openNovo} size="sm">Nova categoria</Button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Carregando categorias...</div>
      ) : categorias.length === 0 ? (
        <EmptyState
          icon={<Tag size={26} />}
          title="Nenhuma categoria"
          message="Crie categorias para organizar seus lançamentos."
          action={<Button icon={<Plus size={15} />} onClick={openNovo} size="sm">Nova categoria</Button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {categorias.map((c) => (
            <div key={c.id} className={styles.listItem}>
              <div className={styles.listItemInfo} style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.885rem' }}>{c.nome}</h4>
                {c.descricao && <p>{c.descricao}</p>}
              </div>
              <div className={styles.listItemActions}>
                <Badge variant={c.genero === 'ENTRADA' ? 'ok' : 'err'}>{c.genero}</Badge>
                <Badge variant={c.ativo ? 'gold' : 'mut'}>{c.ativo ? 'ATIVA' : 'INATIVA'}</Badge>
                <button
                  type="button"
                  onClick={() => alternarAtivo(c)}
                  style={{
                    padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)', background: 'transparent',
                    color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.755rem',
                  }}
                >
                  {c.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  type="button"
                  onClick={() => openEditar(c)}
                  style={{
                    padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)', background: 'transparent',
                    color: 'var(--text-muted)', cursor: 'pointer',
                  }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => excluir(c)}
                  style={{
                    padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(231,76,60,.3)', background: 'rgba(231,76,60,.12)',
                    color: '#ff8a80', cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editando ? 'Editar categoria' : 'Nova categoria'}
        fields={campos}
        values={form as unknown as Record<string, string | number | boolean>}
        onChange={(n, v) => setForm((p) => ({ ...p, [n]: String(v) }))}
        onClose={() => setModalOpen(false)}
        onSave={salvar}
        saveLabel={editando ? 'Salvar' : 'Criar'}
      />
    </Modal>
  );
}
