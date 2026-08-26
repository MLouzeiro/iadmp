'use client';

import SectionHead from '@/components/ui/SectionHead';
import { Lightbulb } from 'lucide-react';

export default function OportunidadesPage() {
  return (
    <div>
      <SectionHead icon={<Lightbulb size={24} />} title="Oportunidades" />
      <p style={{ color: 'var(--text-muted)', marginTop: '2rem', textAlign: 'center' }}>
        Modulo em desenvolvimento. Em breve: registro de oportunidades e necessidades da igreja.
      </p>
    </div>
  );
}
