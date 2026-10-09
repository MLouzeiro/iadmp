'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar, DollarSign, TrendingUp, Users, AlertTriangle, Clock,
  ArrowRight, BarChart3, Wallet, UserCheck,
} from 'lucide-react';
import PageHead from '@/components/ui/PageHead';
import Badge, { statusBadgeVariant } from '@/components/ui/Badge';
import { KpiCard, KpiGrid, TableWrap } from '@/components/ui/KpiCard';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { formatarDataBR } from '@/lib/datas';
import styles from '@/components/ui/form.module.css';

interface DashboardData {
  totalMembros: number;
  totalLideres: number;
  eventosRealizados: number;
  eventosFuturos: number;
  avisosAtivos: number;
}

interface Evento {
  id: string;
  nome: string;
  dataEvento: string;
  local: string | null;
  status: string;
}

interface IndicadoresLideranca {
  ativos: number;
  tempoMedioAtivosDias: number;
  passaram: number;
  tempoMedioPassouDias: number;
}

function dataBR(iso: string) {
  return formatarDataBR(iso);
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [indLideranca, setIndLideranca] = useState<IndicadoresLideranca | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard').then((r) => r.json()).catch(() => null),
      fetch('/api/eventos').then((r) => r.json()).catch(() => null),
      fetch('/api/lideranca/indicadores').then((r) => r.json()).catch(() => null),
    ]).then(([dash, ev, ind]) => {
      setData(dash);
      const lista = Array.isArray(ev) ? ev : ev?.eventos || [];
      setEventos(lista.slice(0, 5));
      setIndLideranca(ind && typeof ind.ativos === 'number' ? ind : null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loadingState}>Carregando dashboard...</div>;

  const pendencias = [
    { label: 'Membros sem congregação definida', nivel: 'ALTA' },
    { label: 'Eventos sem orçamento registrado', nivel: 'NORMAL' },
    { label: 'Pregações em rascunho', nivel: 'BAIXA' },
    { label: 'Avisos expirados para revisar', nivel: 'NORMAL' },
  ];

  return (
    <div>
      <PageHead
        title="Dashboard"
        subtitle="Visão geral da igreja · indicadores consolidados"
        actions={
          <Link href="/admin/gestao" style={{ textDecoration: 'none' }}>
            <Button icon={<BarChart3 size={15} />} size="sm">Abrir Centro de Gestão</Button>
          </Link>
        }
      />

      <KpiGrid>
        <KpiCard label="Total de Membros" value={data?.totalMembros || 0} icon={<Users size={22} />} />
        <KpiCard label="Líderes" value={data?.totalLideres || 0} icon={<TrendingUp size={22} />} />
        <KpiCard label="Eventos Realizados" value={data?.eventosRealizados || 0} icon={<Calendar size={22} />} />
        <KpiCard label="Eventos Futuros" value={data?.eventosFuturos || 0} icon={<Clock size={22} />} />
        <KpiCard label="Avisos Ativos" value={data?.avisosAtivos || 0} icon={<AlertTriangle size={22} />} />
        <KpiCard label="Saldo do Período" value="—" icon={<Wallet size={22} />} />
      </KpiGrid>

      <div
        style={{
          marginTop: '1.5rem',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          borderLeft: '3px solid var(--color-primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserCheck size={20} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>Gestão de Liderança</h3>
          </div>
          <Link href="/admin/lideranca" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" icon={<ArrowRight size={15} />} size="sm">Abrir Liderança</Button>
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Ativos', valor: String(indLideranca?.ativos ?? 0), detalhe: 'Mandatos em curso' },
            {
              label: 'Tempo médio (ativos)',
              valor: `${indLideranca?.tempoMedioAtivosDias ?? 0} dias`,
              detalhe: 'Em curso',
            },
            { label: 'Passaram', valor: String(indLideranca?.passaram ?? 0), detalhe: 'Mandatos encerrados' },
            {
              label: 'Tempo médio (encerrados)',
              valor: `${indLideranca?.tempoMedioPassouDias ?? 0} dias`,
              detalhe: 'Duração média',
            },
          ].map((item) => (
            <div key={item.label}>
              <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                {item.label}
              </p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {item.valor}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.detalhe}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Últimos Eventos</h3>
          {eventos.length === 0 ? (
            <EmptyState
              icon={<Calendar size={26} />}
              title="Nenhum evento"
              message="Cadastre eventos para vê-los aqui."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Data</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.nome}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.local || '—'}</div>
                    </td>
                    <td>{dataBR(e.dataEvento)}</td>
                    <td><Badge variant={statusBadgeVariant(e.status)}>{e.status.replace(/_/g, ' ')}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </div>

        <div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Pendências Críticas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {pendencias.map((p, i) => (
              <div key={i} className={styles.listItem}>
                <div className={styles.listItemInfo} style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.885rem' }}>{p.label}</h4>
                </div>
                <div className={styles.listItemActions}>
                  <Badge variant={p.nivel === 'ALTA' ? 'err' : p.nivel === 'NORMAL' ? 'warn' : 'mut'}>{p.nivel}</Badge>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1.15rem' }}>
            <Link href="/admin/gestao?aba=pendencias" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" icon={<ArrowRight size={15} />} size="sm">Ver todas as pendências</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
