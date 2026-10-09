'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, UserCheck, Eye } from 'lucide-react';
import PageHead from '@/components/ui/PageHead';
import Button from '@/components/ui/Button';
import Badge, { statusBadgeVariant } from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Modal, { ModalField } from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import SearchBar from '@/components/ui/SearchBar';
import { useToast } from '@/components/ui/Toast';
import styles from '@/components/ui/form.module.css';
import { useOrganizacoes } from '@/hooks/useOrganizacoes';
import { formatarDataBR } from '@/lib/datas';

interface Lider {
  id: string;
  nome: string;
  cargo: string;
  biografia: string | null;
  publico: boolean;
  ativo: boolean;
  ordemExibicao: number;
  dataInicio?: string | null;
  dataFim?: string | null;
  congregacao?: { id: string; nome: string } | null;
  ministerio: { nome: string } | null;
}

interface IndicadorLiderDetalhe {
  liderancaId: string;
  tempoDias: number;
  tempoLabel: string;
  desempenho: { eventos: number; liturgias: number; pregacoes: number; total: number };
}

interface IndicadoresLideranca {
  ativos: number;
  tempoMedioAtivosDias: number;
  passaram: number;
  tempoMedioPassouDias: number;
  lideres: IndicadorLiderDetalhe[];
}

function paraInputDate(valor: string | null | undefined): string {
  if (!valor) return '';
  return valor.slice(0, 10);
}

export default function LiderancaPage() {
  const { toast, confirm } = useToast();
  const { orgs, loading: orgsLoading, multiOrg } = useOrganizacoes();
  const [lideres, setLideres] = useState<Lider[]>([]);
  const [indicadores, setIndicadores] = useState<IndicadoresLideranca | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detalhe, setDetalhe] = useState<Lider | null>(null);
  const [editando, setEditando] = useState<Lider | null>(null);
  const [form, setForm] = useState({
    organizacaoId: '',
    nome: '',
    cargo: '',
    congregacao: '',
    biografia: '',
    publico: true,
    ativo: true,
    ordemExibicao: '',
    dataInicio: '',
    dataFim: '',
  });

  const fetchLideres = useCallback(() => {
    fetch('/api/lideranca')
      .then((r) => r.json())
      .then((d) => setLideres(Array.isArray(d) ? d : d.lideres || []))
      .catch(() => setLideres([]))
      .finally(() => setLoading(false));
    fetch('/api/lideranca/indicadores')
      .then((r) => r.json())
      .then((d) => setIndicadores(d && typeof d.ativos === 'number' ? d : null))
      .catch(() => setIndicadores(null));
  }, []);

  useEffect(() => { fetchLideres(); }, [fetchLideres]);

  const openNovo = () => {
    setEditando(null);
    setForm({ organizacaoId: orgs.length === 1 ? orgs[0].id : '', nome: '', cargo: '', congregacao: '', biografia: '', publico: true, ativo: true, ordemExibicao: '', dataInicio: '', dataFim: '' });
    setModalOpen(true);
  };

  const openEditar = (l: Lider) => {
    setEditando(l);
    setForm({
      organizacaoId: (l as unknown as { organizacaoId?: string }).organizacaoId || (orgs.length === 1 ? orgs[0].id : ''),
      nome: l.nome,
      cargo: l.cargo,
      congregacao: l.congregacao?.nome || '',
      biografia: l.biografia || '',
      publico: l.publico,
      ativo: l.ativo,
      ordemExibicao: String(l.ordemExibicao),
      dataInicio: paraInputDate(l.dataInicio),
      dataFim: paraInputDate(l.dataFim),
    });
    setModalOpen(true);
  };

  const salvar = async () => {
    if (multiOrg && !form.organizacaoId) {
      toast('Selecione a organização.', 'warn');
      return;
    }
    if (!form.nome.trim() || !form.cargo.trim()) {
      toast('Preencha nome e cargo.', 'warn');
      return;
    }
    const payload = {
      organizacaoId: form.organizacaoId || undefined,
      nome: form.nome,
      cargo: form.cargo,
      congregacao: form.congregacao || undefined,
      biografia: form.biografia || undefined,
      publico: form.publico,
      ativo: form.ativo,
      ordemExibicao: form.ordemExibicao ? parseInt(form.ordemExibicao) : 0,
      dataInicio: form.dataInicio || undefined,
      dataFim: form.dataFim || undefined,
    };

    const res = await fetch(editando ? `/api/lideranca/${editando.id}` : '/api/lideranca', {
      method: editando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast(editando ? 'Líder atualizado.' : 'Líder criado.', 'ok');
      setModalOpen(false);
      fetchLideres();
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error || 'Erro ao salvar líder.', 'err');
    }
  };

  const excluir = (l: Lider) => {
    confirm(`Excluir o líder "${l.nome}"?`, async () => {
      const res = await fetch(`/api/lideranca/${l.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Líder excluído.', 'ok');
        fetchLideres();
      } else {
        toast('Erro ao excluir líder.', 'err');
      }
    }, { title: 'Excluir líder', danger: true });
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
    { name: 'nome', label: 'Nome', value: form.nome, required: true },
    { name: 'cargo', label: 'Cargo', value: form.cargo, required: true },
    { name: 'congregacao', label: 'Congregação', value: form.congregacao, placeholder: 'Ex: Matriz' },
    { name: 'ordemExibicao', label: 'Ordem de exibição', type: 'number', value: form.ordemExibicao, min: 0 },
    { name: 'biografia', label: 'Biografia', type: 'textarea', value: form.biografia, full: true },
    { name: 'dataInicio', label: 'Início do mandato', type: 'date', value: form.dataInicio },
    { name: 'dataFim', label: 'Fim do mandato', type: 'date', value: form.dataFim },
    { name: 'publico', label: 'Público no site', type: 'checkbox', value: form.publico, placeholder: 'Exibir no site público' },
    { name: 'ativo', label: 'Ativo', type: 'checkbox', value: form.ativo, placeholder: 'Líder ativo' },
  ];

  const onChange = (name: string, value: string | number | boolean) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const filtrados = lideres.filter((l) =>
    !search ||
    l.nome.toLowerCase().includes(search.toLowerCase()) ||
    l.cargo.toLowerCase().includes(search.toLowerCase())
  );

  const indDetalhe = detalhe
    ? indicadores?.lideres?.find((d) => d.liderancaId === detalhe.id) ?? null
    : null;

  return (
    <div>
      <PageHead
        title="Liderança"
        subtitle="Ordem de exibição no site público · vinculação com membro e ministério"
        actions={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Novo Líder</Button>}
      />

      {indicadores && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          {[
            { label: 'Líderes ativos', valor: String(indicadores.ativos), detalhe: 'Com mandato em curso' },
            {
              label: 'Tempo médio (ativos)',
              valor: `${indicadores.tempoMedioAtivosDias} dias`,
              detalhe: indicadores.tempoMedioAtivosDias > 0 ? 'Desde o início do mandato' : 'Sem dados',
            },
            { label: 'Já passaram', valor: String(indicadores.passaram), detalhe: 'Mandatos encerrados' },
            {
              label: 'Tempo médio (encerrados)',
              valor: `${indicadores.tempoMedioPassouDias} dias`,
              detalhe: indicadores.tempoMedioPassouDias > 0 ? 'Duração média do mandato' : 'Sem dados',
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '0.9rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                borderLeft: '3px solid var(--color-primary)',
              }}
            >
              <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                {item.label}
              </p>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {item.valor}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{item.detalhe}</p>
            </div>
          ))}
        </div>
      )}

      <div className={styles.toolbar}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar líder..." />
      </div>

      {loading ? (
        <div className={styles.loadingState}>Carregando liderança...</div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={<UserCheck size={30} />}
          title="Nenhum líder encontrado"
          message={search ? 'Tente outro termo de busca.' : 'Cadastre os servos da comunidade.'}
          action={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Novo Líder</Button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtrados.map((l) => (
            <div key={l.id} className={styles.listItem}>
              <div className={styles.listItemAvatar}>
                <Avatar name={l.nome} />
                <div className={styles.listItemInfo}>
                  <h4>{l.nome}</h4>
                  <p>
                    {l.cargo}
                    {l.congregacao && ` · ${l.congregacao.nome}`}
                    {l.ministerio && ` · ${l.ministerio.nome}`}
                  </p>
                </div>
              </div>
              <div className={styles.listItemActions}>
                <Badge variant={statusBadgeVariant(l.ativo ? 'ATIVO' : 'INATIVO')}>{l.ativo ? 'ATIVO' : 'INATIVO'}</Badge>
                <Badge variant={l.publico ? 'gold' : 'mut'}>{l.publico ? 'PÚBLICO' : 'PRIVADO'}</Badge>
                <Button size="sm" variant="secondary" icon={<Eye size={14} />} onClick={() => setDetalhe(l)}>Detalhes</Button>
                <Button size="sm" variant="secondary" icon={<Pencil size={14} />} onClick={() => openEditar(l)}>Editar</Button>
                <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => excluir(l)}>Excluir</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editando ? 'Editar Líder' : 'Novo Líder'}
        description="POST /api/lideranca · schema Zod liderancaSchema"
        fields={campos}
        values={form as unknown as Record<string, string | number | boolean>}
        onChange={onChange}
        onClose={() => setModalOpen(false)}
        onSave={salvar}
        saveLabel={editando ? 'Salvar alterações' : 'Criar líder'}
      />

      <Modal
        open={!!detalhe}
        title={detalhe ? `Detalhes — ${detalhe.nome}` : 'Detalhes do líder'}
        description="Mandato e desempenho no ano corrente"
        onClose={() => setDetalhe(null)}
      >
        {detalhe && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
              {[
                { rot: 'Cargo', val: detalhe.cargo },
                { rot: 'Congregação', val: detalhe.congregacao?.nome || '—' },
                { rot: 'Ministério', val: detalhe.ministerio?.nome || '—' },
                { rot: 'Situação', val: detalhe.ativo ? 'Ativo' : 'Inativo' },
                { rot: 'Público no site', val: detalhe.publico ? 'Sim' : 'Não' },
                { rot: 'Início do mandato', val: formatarDataBR(detalhe.dataInicio) || '—' },
                {
                  rot: 'Fim do mandato',
                  val: detalhe.dataFim
                    ? formatarDataBR(detalhe.dataFim)
                    : detalhe.ativo ? 'Em curso' : 'Não informado',
                },
                { rot: 'Tempo de mandato', val: indDetalhe ? indDetalhe.tempoLabel : '—' },
              ].map((item) => (
                <div key={item.rot}>
                  <p style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    {item.rot}
                  </p>
                  <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.val}</p>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: '0.9rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                borderLeft: '3px solid var(--color-primary)',
              }}
            >
              <p style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                Desempenho no ano corrente
              </p>
              {indDetalhe ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.6rem' }}>
                  {[
                    { rot: 'Eventos', val: indDetalhe.desempenho.eventos },
                    { rot: 'Liturgias', val: indDetalhe.desempenho.liturgias },
                    { rot: 'Pregações', val: indDetalhe.desempenho.pregacoes },
                    { rot: 'Total', val: indDetalhe.desempenho.total },
                  ].map((item) => (
                    <div key={item.rot}>
                      <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                        {item.val}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.rot}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Indicadores indisponíveis para este líder.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
