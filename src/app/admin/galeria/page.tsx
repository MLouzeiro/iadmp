'use client';

import SectionHead from '@/components/ui/SectionHead';
import { Images } from 'lucide-react';

export default function GaleriaAdminPage() {
  return (
    <div>
      <SectionHead icon={<Images size={24} />} title="Galeria" />
      <p style={{ color: 'var(--text-muted)', marginTop: '2rem', textAlign: 'center' }}>
        Modulo em desenvolvimento. Em breve: gestao de albuns e upload de imagens.
      </p>
    </div>
  );
}
