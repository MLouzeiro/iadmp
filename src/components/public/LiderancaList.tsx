'use client';

import { useEffect, useState } from 'react';
import { UserCheck } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

interface Lider {
  id: string;
  nome: string;
  cargo: string;
  foto?: string | null;
  congregacao?: { id: string; nome: string } | null;
}

export default function LiderancaList() {
  const [lideres, setLideres] = useState<Lider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/lideranca')
      .then((r) => r.json())
      .then((d) => setLideres(d.lideres || []))
      .catch(() => setLideres([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <EmptyState title="Carregando liderança..." message="Buscando os servos da nossa comunidade." />;
  }

  if (lideres.length === 0) {
    return (
      <EmptyState
        icon={<UserCheck size={30} />}
        title="Em breve"
        message="A liderança será exibida em breve."
      />
    );
  }

  return (
    <div className="grid-4">
      {lideres.map((l) => (
        <div key={l.id} className="leader-card">
          {l.foto ? (
            <img src={l.foto} alt={l.nome} className="leader-avatar" />
          ) : (
            <div className="leader-avatar-placeholder">{l.nome.charAt(0)}</div>
          )}
          <h3>{l.nome}</h3>
          <p className="role">{l.cargo}</p>
          {l.congregacao && <p className="role" style={{ opacity: 0.75 }}>{l.congregacao.nome}</p>}
        </div>
      ))}
    </div>
  );
}
