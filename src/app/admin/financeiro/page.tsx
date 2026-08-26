'use client';

import { useState } from 'react';
import SectionHead from '@/components/ui/SectionHead';
import { DollarSign } from 'lucide-react';

export default function FinanceiroPage() {
  const [resumo] = useState({ entradas: 0, despesas: 0, saldo: 0 });

  return (
    <div>
      <SectionHead icon={<DollarSign size={24} />} title="Financeiro" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Entradas</p>
          <h3 style={{ color: '#4caf50' }}>R$ {resumo.entradas.toLocaleString('pt-BR')}</h3>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Despesas</p>
          <h3 style={{ color: '#e74c3c' }}>R$ {resumo.despesas.toLocaleString('pt-BR')}</h3>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Saldo</p>
          <h3 style={{ color: 'var(--color-secondary)' }}>R$ {resumo.saldo.toLocaleString('pt-BR')}</h3>
        </div>
      </div>

      <p style={{ color: 'var(--text-muted)', marginTop: '2rem', textAlign: 'center' }}>
        Modulo em desenvolvimento. Em breve: gestao completa de entradas e despesas.
      </p>
    </div>
  );
}
