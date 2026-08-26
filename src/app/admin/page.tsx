'use client';

import { useEffect, useState } from 'react';
import { Calendar, DollarSign, TrendingUp, Users, AlertTriangle, Clock } from 'lucide-react';
import SectionHead from '@/components/ui/SectionHead';

interface DashboardData {
  totalMembros: number;
  totalLideres: number;
  eventosRealizados: number;
  eventosFuturos: number;
  avisosAtivos: number;
}

const kpiCardStyle = {
  background: 'var(--bg-card)',
  backdropFilter: 'blur(10px)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  padding: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const kpiIconStyle = {
  width: '3rem',
  height: '3rem',
  borderRadius: 'var(--radius-md)',
  display: 'grid',
  placeItems: 'center' as const,
  fontSize: '1.5rem',
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>;

  return (
    <div>
      <SectionHead icon={<TrendingUp size={24} />} title="Dashboard" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        <div style={kpiCardStyle}>
          <div style={{ ...kpiIconStyle, background: 'var(--gradient-gold)', color: '#fff' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total de Membros</p>
            <h3 style={{ fontSize: '1.8rem' }}>{data?.totalMembros || 0}</h3>
          </div>
        </div>

        <div style={kpiCardStyle}>
          <div style={{ ...kpiIconStyle, background: 'var(--gradient-gold)', color: '#fff' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Lideres</p>
            <h3 style={{ fontSize: '1.8rem' }}>{data?.totalLideres || 0}</h3>
          </div>
        </div>

        <div style={kpiCardStyle}>
          <div style={{ ...kpiIconStyle, background: 'var(--gradient-gold)', color: '#fff' }}>
            <Calendar size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Eventos Realizados</p>
            <h3 style={{ fontSize: '1.8rem' }}>{data?.eventosRealizados || 0}</h3>
          </div>
        </div>

        <div style={kpiCardStyle}>
          <div style={{ ...kpiIconStyle, background: 'var(--gradient-gold)', color: '#fff' }}>
            <Clock size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Eventos Futuros</p>
            <h3 style={{ fontSize: '1.8rem' }}>{data?.eventosFuturos || 0}</h3>
          </div>
        </div>

        <div style={kpiCardStyle}>
          <div style={{ ...kpiIconStyle, background: 'var(--gradient-gold)', color: '#fff' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Avisos Ativos</p>
            <h3 style={{ fontSize: '1.8rem' }}>{data?.avisosAtivos || 0}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
