'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import PageHead from '@/components/ui/PageHead';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal, { ModalField } from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import SearchBar from '@/components/ui/SearchBar';
import { KpiCard, KpiGrid, TableWrap } from '@/components/ui/KpiCard';
import { useToast } from '@/components/ui/Toast';
import CategoriasManager from '@/components/admin/CategoriasManager';
import { Tag } from 'lucide-react';
import { formatarDataBR } from '@/lib/datas';
import styles from '@/components/ui/form.module.css';

interface Lancamento {
  id: string;
  descricao: string;
  valor: string | number;
  quando: string;
  generoMovimentacao: string;
  categoria: string;
  fornecedor: string | null;
  responsavel: string | null;
  observacoes: string | null;
  congregacao?: { id: string; nome: string } | null;
}

const CATEGORIAS = [
  { value: 'DIZIMO', label: 'Dízimo' },
  { value: 'OFERTA', label: 'Oferta' },
  { value: 'DOACAO', label: 'Doação' },
  { value: 'INSCRICAO', label: 'Inscrição' },
  { value: 'DESPESA', label: 'Despesa' },
  { value: 'OUTRO', label: 'Outro' },
];

function money(v: string | number) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function dataBR(iso: string) {
  return formatarDataBR(iso);
}

export default function FinanceiroPage() {
  const { toast, confirm } = useToast();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Lancamento | null>(null);
  const [catsOpen, setCatsOpen] = useState(false);
  const [form, setForm] = useState({
    descricao: '',
    valor: '',
    tipo: 'ENTRADA',
    categoria: 'DIZIMO',
    data: '',
    responsavel: '',
    fornecedor: '',
    categoriaFinanceiraId: '',
    observacoes: '',
  });
  const [cats, setCats] = useState<{ id: string; nome: string; genero: string; ativo?: boolean }[]>([]);

  const fetchLancamentos = useCallback(() => {
    fetch('/api/financeiro')
      .then((r) => r.json())
      .then((d) => setLancamentos(Array.isArray(d) ? d : d.lancamentos || []))
      .catch(() => setLancamentos([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLancamentos(); }, [fetchLancamentos]);
  useEffect(() => { fetch('/api/financeiro/categorias').then(r => r.json()).then(d => setCats(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const entradas = lancamentos.filter((l) => l.generoMovimentacao === 'ENTRADA').reduce((s, l) => s + (typeof l.valor === 'string' ? parseFloat(l.valor) : l.valor), 0);
  const saidas = lancamentos.filter((l) => l.generoMovimentacao === 'SAIDA').reduce((s, l) => s + (typeof l.valor === 'string' ? parseFloat(l.valor) : l.valor), 0);
  const saldo = entradas - saidas;

  const openNovo = () => {
    setEditando(null);
    setForm({ descricao: '', valor: '', tipo: 'ENTRADA', categoria: 'DIZIMO', data: '', responsavel: '', fornecedor: '', observacoes: '', categoriaFinanceiraId: '' });
    setModalOpen(true);
  };

  const openEditar = (l: Lancamento) => {
    setEditando(l);
    setForm({
      descricao: l.descricao,
      valor: String(l.valor),
      tipo: l.generoMovimentacao,
      categoria: l.categoria,
      data: l.quando.slice(0, 10),
      responsavel: l.responsavel || '',
      fornecedor: l.fornecedor || '',
      observacoes: l.observacoes || '',
      categoriaFinanceiraId: (l as { categoriaFinanceiraId?: string }).categoriaFinanceiraId || '',
    });
    setModalOpen(true);
  };

  const salvar = async () => {
    if (!form.descricao.trim() || !form.valor) {
      toast('Preencha descrição e valor.', 'warn');
      return;
    }
    const payload = {
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      tipo: form.tipo,
      categoria: form.categoria,
      data: form.data || undefined,
      responsavel: form.responsavel || undefined,
      fornecedor: form.fornecedor || undefined,
      observacoes: form.observacoes || undefined,
      categoriaFinanceiraId: form.categoriaFinanceiraId || undefined,
    };

    const res = await fetch(editando ? `/api/financeiro/${editando.id}` : '/api/financeiro', {
      method: editando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast(editando ? 'Lançamento atualizado.' : 'Lançamento criado.', 'ok');
      setModalOpen(false);
      fetchLancamentos();
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error || 'Erro ao salvar lançamento.', 'err');
    }
  };

  const excluir = (l: Lancamento) => {
    confirm(`Excluir o lançamento "${l.descricao}"?`, async () => {
      const res = await fetch(`/api/financeiro/${l.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Lançamento excluído.', 'ok');
        fetchLancamentos();
      } else {
        toast('Erro ao excluir lançamento.', 'err');
      }
    }, { title: 'Excluir lançamento', danger: true });
  };

  const campos: ModalField[] = [
    { name: 'descricao', label: 'Descrição', value: form.descricao, required: true, full: true },
    { name: 'valor', label: 'Valor (R$)', type: 'number', value: form.valor, required: true, min: 0, step: 0.01 },
    {
      name: 'tipo', label: 'Movimentação', type: 'select', value: form.tipo,
      options: [
        { value: 'ENTRADA', label: 'Entrada' },
        { value: 'SAIDA', label: 'Saída' },
      ],
    },
    { name: 'categoria', label: 'Categoria', type: 'select', value: form.categoria, options: CATEGORIAS },
    { name: 'categoriaFinanceiraId', label: 'Categoria detalhada', type: 'select', value: form.categoriaFinanceiraId, options: [{ value: '', label: 'Nenhuma' }, ...cats.filter(c => c.ativo !== false).map(c => ({ value: c.id, label: c.nome }))], full: true },
    { name: 'data', label: 'Data', type: 'date', value: form.data },
    { name: 'responsavel', label: 'Responsável', value: form.responsavel },
    { name: 'fornecedor', label: 'Fornecedor', value: form.fornecedor },
    { name: 'observacoes', label: 'Observações', type: 'textarea', value: form.observacoes, full: true },
  ];

  const onChange = (name: string, value: string | number | boolean) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const filtrados = lancamentos.filter((l) =>
    !search ||
    l.descricao.toLowerCase().includes(search.toLowerCase()) ||
    (l.responsavel || '').toLowerCase().includes(search.toLowerCase()) ||
    l.categoria.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHead
        title="Financeiro"
        subtitle="Livro-razão único · dízimo, oferta, doação, inscrição e despesa"
        actions={<><Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Novo Lançamento</Button><Button variant="secondary" icon={<Tag size={15} />} onClick={() => setCatsOpen(true)} size="sm">Categorias</Button></>}
      />

      <KpiGrid>
        <KpiCard label="Receitas" value={money(entradas)} icon={<TrendingUp size={22} />} />
        <KpiCard label="Despesas" value={money(saidas)} icon={<TrendingDown size={22} />} />
        <KpiCard label="Saldo" value={money(saldo)} icon={<Wallet size={22} />} />
      </KpiGrid>

      <div className={styles.toolbar} style={{ marginTop: '1.5rem' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar lançamento..." />
      </div>

      {loading ? (
        <div className={styles.loadingState}>Carregando lançamentos...</div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={<DollarSign size={30} />}
          title="Nenhum lançamento encontrado"
          message={search ? 'Tente outro termo de busca.' : 'Registre a primeira movimentação financeira.'}
          action={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Novo Lançamento</Button>}
        />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Data</th>
              <th>Responsável</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((l) => {
              const v = typeof l.valor === 'string' ? parseFloat(l.valor) : l.valor;
              const entrada = l.generoMovimentacao === 'ENTRADA';
              return (
                <tr key={l.id}>
                  <td>{l.descricao}</td>
                  <td><Badge variant={entrada ? 'ok' : 'err'}>{l.categoria}</Badge></td>
                  <td>{dataBR(l.quando)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{l.responsavel || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: entrada ? '#7ee08a' : '#ff8a80' }}>
                    {entrada ? '+' : '−'} {money(v)}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Button size="sm" variant="secondary" icon={<Pencil size={14} />} onClick={() => openEditar(l)}>Editar</Button>{' '}
                    <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => excluir(l)}>Excluir</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}

      <Modal
        open={modalOpen}
        title={editando ? 'Editar Lançamento' : 'Novo Lançamento'}
        description="POST /api/financeiro · livro-razão (EventoFinanceiro) com categoria"
        fields={campos}
        values={form as unknown as Record<string, string | number | boolean>}
        onChange={onChange}
        onClose={() => setModalOpen(false)}
        onSave={salvar}
        saveLabel={editando ? 'Salvar alterações' : 'Criar lançamento'}
      />
      <CategoriasManager open={catsOpen} onClose={() => setCatsOpen(false)} onChanged={fetchLancamentos} />
    </div>
  );
}
