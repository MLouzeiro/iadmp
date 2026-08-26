'use client';

import SectionHead from '@/components/ui/SectionHead';
import { Bell } from 'lucide-react';

export default function AvisosPage() {
  return (
    <div>
      <SectionHead icon={<Bell size={24} />} title="Avisos" />
      <p style={{ color: 'var(--text-muted)', marginTop: '2rem', textAlign: 'center' }}>
        Modulo em desenvolvimento. Em breve: gestao de avisos e integracao com o site.
      </p>
    </div>
  );
}
