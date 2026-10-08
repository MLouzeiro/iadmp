'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, Clock, XCircle, UserCheck, Trash2, Download, UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Modal, { ModalField } from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { KpiCard, KpiGrid, TableWrap } from '@/components/ui/KpiCard';
import { useToast } from '@/components/ui/Toast';
import { formatarDataBR } from '@/lib/datas';
import styles from '@/components/ui/form.module.css';

interface Inscricao {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  status: string;
  valorPrevisto: string | number | null;
  valorPago: string | number;
  checkIn: boolean;
  dataCheckIn: string | null;
  createdAt: string;
  membro?: { id: string; nome: string } | null;
  pagamentos: { id: string; valor: string | number; forma: string; status: string; dataPagamento: string | null }[];
}

interface Props {
  eventoId: string;
  taxa: number;
}

const statusVariant = (s: string) =>
  s === 'CONFIRMADA' || s === 'REALIZADA' ? 'ok' : s === 'CANCELADA' ? 'err' : 'warn';

function money(v: string | number | null) {
  const n = typeof v === 'string' ? parseFloat(v) : v || 0;
  return (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function InscricoesManager({ eventoId, taxa }: Props) {
  const { toast, confirm } = useToast();
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', observacoes: '' });

  const fetchInscricoes = useCallback(() => {
    fetch(`/api/eventos/${eventoId}/inscricoes`)
      .then((r) => r.json())
      .then((d) => setInscricoes(Array.isArray(d) ? d : []))
      .catch(() => setInscricoes([]))
      .finally(() => setLoading(false));
  }, [eventoId]);

  useEffect(() => { fetchInscricoes(); }, [fetchInscricoes]);

  const confirmadas = inscricoes.filter((i) => i.status === 'CONFIRMADA' || i.status === 'REALIZADA');
  const pendentes = inscricoes.filter((i) => i.status === 'PENDENTE');
  const totalPago = inscricoes.reduce((s, i) => s + (typeof i.valorPago === 'string' ? parseFloat(i.valorPago) : i.valorPago || 0), 0);

  const criarInscricao = async () => {
    if (!form.nome.trim()) {
      toast('Informe o nome.', 'warn');
      return;
    }
    const res = await fetch(`/api/eventos/${eventoId}/inscricoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast('Inscrição criada.', 'ok');
      setModalOpen(false);
      setForm({ nome: '', email: '', telefone: '', observacoes: '' });
      fetchInscricoes();
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error || 'Erro ao criar inscrição.', 'err');
    }
  };

  const confirmarPagamento = (insc: Inscricao) => {
    confirm(`Confirmar pagamento de ${insc.nome}?`, async () => {
      const res = await fetch(`/api/eventos/${eventoId}/inscricoes/${insc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmarPagamento: true }),
      });
      if (res.ok) {
        toast('Pagamento confirmado e inscrição aprovada.', 'ok');
        fetchInscricoes();
      } else {
        toast('Erro ao confirmar pagamento.', 'err');
      }
    }, { title: 'Confirmar pagamento' });
  };

  const alternarCheckIn = async (insc: Inscricao) => {
    const res = await fetch(`/api/eventos/${eventoId}/inscricoes/${insc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkIn: !insc.checkIn }),
    });
    if (res.ok) {
      toast(insc.checkIn ? 'Check-in removido.' : 'Check-in registrado.', 'ok');
      fetchInscricoes();
    }
  };

  const excluir = (insc: Inscricao) => {
    confirm(`Excluir a inscrição de ${insc.nome}?`, async () => {
      const res = await fetch(`/api/eventos/${eventoId}/inscricoes/${insc.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Inscrição excluída.', 'ok');
        fetchInscricoes();
      } else {
        toast('Erro ao excluir inscrição.', 'err');
      }
    }, { title: 'Excluir inscrição', danger: true });
  };

  const exportarCSV = () => {
    const linhas: string[][] = [
      ['Nome', 'E-mail', 'Telefone', 'Status', 'Valor Previsto', 'Valor Pago', 'Check-in', 'Criada em'],
      ...inscricoes.map((i) => [
        i.nome,
        i.email || '',
        i.telefone || '',
        i.status,
        String(i.valorPrevisto || ''),
        String(i.valorPago || ''),
        i.checkIn ? 'Sim' : 'Não',
        formatarDataBR(i.createdAt),
      ]),
    ];
    const csv = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inscricoes-${eventoId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV exportado.', 'ok');
  };

  const campos: ModalField[] = [
    { name: 'nome', label: 'Nome completo', value: form.nome, required: true, full: true },
    { name: 'email', label: 'E-mail', type: 'email', value: form.email },
    { name: 'telefone', label: 'Telefone', type: 'tel', value: form.telefone },
    { name: 'observacoes', label: 'Observações', type: 'textarea', value: form.observacoes, full: true },
  ];

  return (
    <div>
      <KpiGrid>
        <KpiCard label="Total de inscrições" value={inscricoes.length} icon={<UserCheck size={22} />} />
        <KpiCard label="Confirmadas" value={confirmadas.length} icon={<CheckCircle size={22} />} />
        <KpiCard label="Pendentes" value={pendentes.length} icon={<Clock size={22} />} />
        <KpiCard label="Total arrecadado" value={money(totalPago)} icon={<CheckCircle size={22} />} />
      </KpiGrid>

      <div className={styles.toolbar} style={{ marginTop: '1.5rem' }}>
        <Button icon={<UserPlus size={15} />} onClick={() => setModalOpen(true)} size="sm">Nova inscrição</Button>
        <Button variant="secondary" icon={<Download size={15} />} onClick={exportarCSV} size="sm">Exportar CSV</Button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Carregando inscrições...</div>
      ) : inscricoes.length === 0 ? (
        <EmptyState
          icon={<UserCheck size={30} />}
          title="Nenhuma inscrição"
          message="As inscrições aparecem aqui conforme os participantes se registram."
          action={<Button icon={<UserPlus size={15} />} onClick={() => setModalOpen(true)} size="sm">Nova inscrição</Button>}
        />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th>Participante</th>
              <th>Status</th>
              <th>Valor</th>
              <th>Check-in</th>
              <th>Inscrito em</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {inscricoes.map((i) => (
              <tr key={i.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Avatar name={i.nome} size="sm" />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{i.nome}</div>
                      <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
                        {i.email || '—'}{i.telefone ? ` · ${i.telefone}` : ''}
                      </div>
                    </div>
                  </div>
                </td>
                <td><Badge variant={statusVariant(i.status)}>{i.status}</Badge></td>
                <td>
                  <div style={{ fontSize: '0.825rem' }}>
                    <div>Prev: {money(i.valorPrevisto)}</div>
                    <div style={{ color: i.valorPago && Number(i.valorPago) > 0 ? '#7ee08a' : 'var(--text-muted)' }}>
                      Pago: {money(i.valorPago)}
                    </div>
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => alternarCheckIn(i)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)',
                      border: '1px solid ' + (i.checkIn ? 'rgba(76,175,80,.32)' : 'var(--border-color)'),
                      background: i.checkIn ? 'rgba(76,175,80,.16)' : 'transparent',
                      color: i.checkIn ? '#7ee08a' : 'var(--text-muted)',
                      cursor: 'pointer', fontSize: '0.755rem', fontWeight: 600,
                    }}
                  >
                    <UserCheck size={13} /> {i.checkIn ? 'Presente' : 'Marcar'}
                  </button>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>{formatarDataBR(i.createdAt)}</td>
                <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                  {i.status === 'PENDENTE' && (
                    <Button size="sm" variant="secondary" icon={<CheckCircle size={13} />} onClick={() => confirmarPagamento(i)}>
                      Confirmar
                    </Button>
                  )}{' '}
                  <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={() => excluir(i)}>Excluir</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal
        open={modalOpen}
        title="Nova inscrição"
        description={`Inscrição manual${taxa > 0 ? ` · taxa de ${money(taxa)}` : ''}`}
        fields={campos}
        values={form as unknown as Record<string, string | number | boolean>}
        onChange={(n, v) => setForm((p) => ({ ...p, [n]: String(v) }))}
        onClose={() => setModalOpen(false)}
        onSave={criarInscricao}
        saveLabel="Criar inscrição"
      />
    </div>
  );
}
