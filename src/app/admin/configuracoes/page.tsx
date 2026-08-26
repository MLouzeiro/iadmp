'use client';

import SectionHead from '@/components/ui/SectionHead';
import { Settings } from 'lucide-react';

export default function ConfiguracoesPage() {
  return (
    <div>
      <SectionHead icon={<Settings size={24} />} title="Configuracoes" />
      <p style={{ color: 'var(--text-muted)', marginTop: '2rem', textAlign: 'center' }}>
        Modulo em desenvolvimento. Em breve: configuracoes do sistema e gerenciamento de usuarios.
      </p>
    </div>
  );
}
