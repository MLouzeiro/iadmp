'use client';

import SectionHead from '@/components/ui/SectionHead';
import { BookOpen } from 'lucide-react';

export default function LiturgiaPage() {
  return (
    <div>
      <SectionHead icon={<BookOpen size={24} />} title="Liturgia" />
      <p style={{ color: 'var(--text-muted)', marginTop: '2rem', textAlign: 'center' }}>
        Modulo em desenvolvimento. Em breve: gestao de liturgia e ordem dos cultos.
      </p>
    </div>
  );
}
