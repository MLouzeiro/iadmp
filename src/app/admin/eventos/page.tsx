'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Calendar, Users } from 'lucide-react';
import PageHead from '@/components/ui/PageHead';
import Button from '@/components/ui/Button';
import Badge, { statusBadgeVariant } from '@/components/ui/Badge';
import Modal, { ModalField } from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import SearchBar from '@/components/ui/SearchBar';
import { useToast } from '@/components/ui/Toast';
import InscricoesManager from '@/components/admin/InscricoesManager';
import Tabs from '@/components/ui/Tabs';
import { formatarDataBR } from '@/lib/datas';
import { useOrganizacoes } from '@/hooks/useOrganizacoes';
import styles from '@/components/ui/form.module.css';

interface Evento {
  id: string;
  nome: string;
  dataEvento: string;
  dataInicio: string | null;
  status: string;
  tema: string | null;
  local: string | null;
  orcamentoPrevisto: string | number | null;
  publicarNoSite: boolean;
  aceitaInscricoes?: boolean;
  limiteInscricoes?: number | null;
  taxaInscricao?: string | number | null;
  chavePix?: string | null;
  tipoChavePix?: string | null;
  nomeRecebedor?: string | null;
  cidadeRecebedor?: string | null;
}

function dataBR(iso: string) {
  return formatarDataBR(iso);
}

export default function EventosAdminPage() {
  const { toast, confirm } = useToast();
  const { orgs, loading: orgsLoading, multiOrg } = useOrganizacoes();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Evento | null>(null);
  const [form, setForm] = useState({
    organizacaoId: '',
    nome: '',
    dataEvento: '',
    dataInicio: '',
    dataFim: '',
    inscricoesAbremEm: '',
    inscricoesFechamEm: '',
    diasDuracao: '',
    tema: '',
    local: '',
    status: 'PLANEJADO',
    orcamentoPrevisto: '',
    publicarNoSite: true,
    aceitaInscricoes: false,
    limiteInscricoes: '',
    taxaInscricao: '',
    chavePix: '',
    tipoChavePix: 'CPF',
    nomeRecebedor: '',
    cidadeRecebedor: '',
  });
  const [eventoSel, setEventoSel] = useState<string | null>(null);

  const fetchEventos = useCallback(() => {
    fetch('/api/eventos')
      .then((r) => r.json())
      .then((d) => setEventos(Array.isArray(d) ? d : d.eventos || []))
      .catch(() => setEventos([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchEventos(); }, [fetchEventos]);

  useEffect(() => {
    if (orgs.length === 1) {
      setForm((f) => (f.organizacaoId ? f : { ...f, organizacaoId: orgs[0].id }));
    }
  }, [orgs]);

  const openNovo = () => {
    setEditando(null);
    setForm({ organizacaoId: orgs.length === 1 ? orgs[0].id : '', nome: '', dataEvento: '', dataInicio: '', dataFim: '', inscricoesAbremEm: '', inscricoesFechamEm: '', diasDuracao: '', tema: '', local: '', status: 'PLANEJADO', orcamentoPrevisto: '', publicarNoSite: true, aceitaInscricoes: false, limiteInscricoes: '', taxaInscricao: '', chavePix: '', tipoChavePix: 'CPF', nomeRecebedor: '', cidadeRecebedor: '' });
    setModalOpen(true);
  };

  const openEditar = (e: Evento) => {
    setEditando(e);
    setForm({
      organizacaoId: (e as unknown as { organizacaoId?: string }).organizacaoId || (orgs.length === 1 ? orgs[0].id : ''),
      nome: e.nome,
      dataEvento: e.dataEvento ? e.dataEvento.slice(0, 10) : '',
      dataInicio: e.dataInicio ? e.dataInicio.slice(0, 10) : '',
      dataFim: (e as unknown as { dataFim?: string }).dataFim ? (e as unknown as { dataFim: string }).dataFim.slice(0, 10) : '',
      inscricoesAbremEm: (e as unknown as { inscricoesAbremEm?: string }).inscricoesAbremEm ? (e as unknown as { inscricoesAbremEm: string }).inscricoesAbremEm.slice(0, 10) : '',
      inscricoesFechamEm: (e as unknown as { inscricoesFechamEm?: string }).inscricoesFechamEm ? (e as unknown as { inscricoesFechamEm: string }).inscricoesFechamEm.slice(0, 10) : '',
      diasDuracao: (e as unknown as { diasDuracao?: number }).diasDuracao != null ? String((e as unknown as { diasDuracao: number }).diasDuracao) : '',
      tema: e.tema || '',
      local: e.local || '',
      status: e.status,
      orcamentoPrevisto: e.orcamentoPrevisto !== null ? String(e.orcamentoPrevisto) : '',
      publicarNoSite: e.publicarNoSite,
      aceitaInscricoes: e.aceitaInscricoes ?? false,
      limiteInscricoes: e.limiteInscricoes != null ? String(e.limiteInscricoes) : '',
      taxaInscricao: e.taxaInscricao != null ? String(e.taxaInscricao) : '',
      chavePix: e.chavePix || '',
      tipoChavePix: e.tipoChavePix || 'CPF',
      nomeRecebedor: e.nomeRecebedor || '',
      cidadeRecebedor: e.cidadeRecebedor || '',
    });
    setModalOpen(true);
  };

  const salvar = async () => {
    if (orgsLoading) {
      toast('Carregando organiza\u00e7\u00f5es, aguarde...', 'warn');
      return;
    }
    if (!form.nome.trim() || !form.dataEvento) {
      toast('Preencha nome e data do evento.', 'warn');
      return;
    }
    if (multiOrg && !form.organizacaoId) {
      toast('Selecione a organiza\u00e7\u00e3o do evento.', 'warn');
      return;
    }

    let diasDuracao = form.diasDuracao ? parseInt(form.diasDuracao) : undefined;
    if (!diasDuracao && form.dataFim) {
      const inicio = new Date(form.dataEvento + 'T12:00:00');
      const fim = new Date(form.dataFim + 'T12:00:00');
      const diff = Math.round((fim.getTime() - inicio.getTime()) / 86400000) + 1;
      if (diff > 0) diasDuracao = diff;
    }

    const payload = {
      organizacaoId: form.organizacaoId || undefined,
      nome: form.nome,
      dataEvento: form.dataEvento,
      dataInicio: form.dataInicio || undefined,
      dataFim: form.dataFim || undefined,
      inscricoesAbremEm: form.inscricoesAbremEm || undefined,
      inscricoesFechamEm: form.inscricoesFechamEm || undefined,
      diasDuracao,
      tema: form.tema || undefined,
      local: form.local || undefined,
      status: form.status,
      orcamentoPrevisto: form.orcamentoPrevisto ? parseFloat(form.orcamentoPrevisto) : undefined,
      aceitaInscricoes: form.aceitaInscricoes,
      limiteInscricoes: form.limiteInscricoes ? parseInt(form.limiteInscricoes) : undefined,
      taxaInscricao: form.taxaInscricao ? parseFloat(form.taxaInscricao) : undefined,
      chavePix: form.chavePix || undefined,
      tipoChavePix: form.tipoChavePix || undefined,
      nomeRecebedor: form.nomeRecebedor || undefined,
      cidadeRecebedor: form.cidadeRecebedor || undefined,
      publicarNoSite: form.publicarNoSite,
    };

    const res = await fetch(editando ? `/api/eventos/${editando.id}` : '/api/eventos', {
      method: editando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast(editando ? 'Evento atualizado.' : 'Evento criado.', 'ok');
      setModalOpen(false);
      fetchEventos();
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error || 'Erro ao salvar evento.', 'err');
    }
  };

  const excluir = (e: Evento) => {
    confirm(`Excluir o evento "${e.nome}"?`, async () => {
      const res = await fetch(`/api/eventos/${e.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Evento excluído.', 'ok');
        fetchEventos();
      } else {
        toast('Erro ao excluir evento.', 'err');
      }
    }, { title: 'Excluir evento', danger: true });
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
    { name: 'nome', label: 'Nome', value: form.nome, required: true, full: true },
    { name: 'dataEvento', label: 'Data do evento', type: 'date', value: form.dataEvento, required: true },
    { name: 'dataInicio', label: 'Data de in\u00edcio', type: 'date', value: form.dataInicio },
    { name: 'dataFim', label: 'Data fim', type: 'date', value: form.dataFim },
    { name: 'diasDuracao', label: 'Dura\u00e7\u00e3o (dias)', type: 'number', value: form.diasDuracao, min: 1, placeholder: 'Auto se data fim preenchida' },
    { name: 'tema', label: 'Tema', value: form.tema },
    { name: 'local', label: 'Local', value: form.local },
    {
      name: 'status', label: 'Status', type: 'select', value: form.status,
      options: [
        { value: 'PLANEJADO', label: 'Planejado' },
        { value: 'EM_ANDAMENTO', label: 'Em andamento' },
        { value: 'CONCLUIDO', label: 'Concluído' },
        { value: 'CANCELADO', label: 'Cancelado' },
      ],
    },
    { name: 'orcamentoPrevisto', label: 'Orçamento previsto (R$)', type: 'number', value: form.orcamentoPrevisto, min: 0, step: 0.01 },
    { name: 'publicarNoSite', label: 'Publicar no site', type: 'checkbox', value: form.publicarNoSite, placeholder: 'Exibir no site público' },
    { name: 'aceitaInscricoes', label: 'Aceita inscrições', type: 'checkbox', value: form.aceitaInscricoes, placeholder: 'Abrir inscrições para este evento' },
    ...(form.aceitaInscricoes
      ? [
          { name: 'inscricoesAbremEm', label: 'Inscri\u00e7\u00f5es abrem em', type: 'date' as const, value: form.inscricoesAbremEm },
          { name: 'inscricoesFechamEm', label: 'Inscri\u00e7\u00f5es fecham em', type: 'date' as const, value: form.inscricoesFechamEm },
        ]
      : []),
    { name: 'limiteInscricoes', label: 'Limite de vagas', type: 'number', value: form.limiteInscricoes, min: 0 },
    { name: 'taxaInscricao', label: 'Taxa de inscrição (R$)', type: 'number', value: form.taxaInscricao, min: 0, step: 0.01 },
    { name: 'chavePix', label: 'Chave PIX', value: form.chavePix, full: true, placeholder: 'CPF, CNPJ, e-mail, telefone ou chave aleatoria' },
    { name: 'tipoChavePix', label: 'Tipo da chave', type: 'select', value: form.tipoChavePix, options: [ { value: 'CPF', label: 'CPF' }, { value: 'CNPJ', label: 'CNPJ' }, { value: 'EMAIL', label: 'E-mail' }, { value: 'TELEFONE', label: 'Telefone' }, { value: 'ALEATORIA', label: 'Aleatoria' } ] },
    { name: 'nomeRecebedor', label: 'Nome do recebedor', value: form.nomeRecebedor },
    { name: 'cidadeRecebedor', label: 'Cidade do recebedor', value: form.cidadeRecebedor },
  ];

  const onChange = (name: string, value: string | number | boolean) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const filtrados = eventos.filter((e) =>
    !search ||
    e.nome.toLowerCase().includes(search.toLowerCase()) ||
    (e.tema || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.local || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHead
        title="Eventos"
        subtitle="Inscrições · pagamentos · check-in · campanhas · conciliação"
        actions={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Novo Evento</Button>}
      />

      <div className={styles.toolbar}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar evento..." />
      </div>

      {loading ? (
        <div className={styles.loadingState}>Carregando eventos...</div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={<Calendar size={30} />}
          title="Nenhum evento encontrado"
          message={search ? 'Tente outro termo de busca.' : 'Cadastre o primeiro evento da igreja.'}
          action={<Button icon={<Plus size={16} />} onClick={openNovo} size="sm">Novo Evento</Button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtrados.map((e) => (
            <div key={e.id} className={styles.listItem}>
              <div className={styles.listItemAvatar}>
                <div style={{
                  width: '2.65rem', height: '2.65rem', borderRadius: 'var(--radius-md)',
                  background: 'var(--gradient-gold)', color: '#fff', display: 'grid', placeItems: 'center',
                  fontFamily: "'Playfair Display', serif", fontSize: '1.15rem', flexShrink: 0,
                }}>
                  {new Date(e.dataEvento + 'T12:00:00').getDate()}
                </div>
                <div className={styles.listItemInfo}>
                  <h4>{e.nome}</h4>
                  <p>
                    {e.tema || 'Sem tema'}
                    {' · '}{e.local || 'Sem local'}
                    {' · '}{dataBR(e.dataEvento)}
                    {e.orcamentoPrevisto !== null && ` · orçamento ${Number(e.orcamentoPrevisto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                  </p>
                </div>
              </div>
              <div className={styles.listItemActions}>
                <Badge variant={statusBadgeVariant(e.status)}>{e.status.replace(/_/g, ' ')}</Badge>
                {e.publicarNoSite && <Badge variant="gold">SITE</Badge>}
                <Button size="sm" variant="secondary" icon={<Users size={14} />} onClick={() => setEventoSel(eventoSel === e.id ? null : e.id)}>Inscrições</Button>
                <Button size="sm" variant="secondary" icon={<Pencil size={14} />} onClick={() => openEditar(e)}>Editar</Button>
                <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => excluir(e)}>Excluir</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {eventoSel && (() => {
        const ev = eventos.find((x) => x.id === eventoSel);
        if (!ev) return null;
        return (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.15rem' }}>
                Inscricoes de {ev.nome}
              </h3>
              <Button variant='secondary' size='sm' onClick={() => setEventoSel(null)}>Fechar</Button>
            </div>
            <InscricoesManager eventoId={ev.id} taxa={ev.taxaInscricao ? Number(ev.taxaInscricao) : 0} />
          </div>
        );
      })()}

      <Modal
        open={modalOpen}
        title={editando ? 'Editar Evento' : 'Novo Evento'}
        description="POST /api/eventos · schema Zod eventoSchema · org resolvida + assertOrgAccess"
        fields={campos}
        values={form as unknown as Record<string, string | number | boolean>}
        onChange={onChange}
        onClose={() => setModalOpen(false)}
        onSave={salvar}
        saveLabel={editando ? 'Salvar alterações' : 'Criar evento'}
      />
    </div>
  );
}
