'use client';

import { MessageCircle } from 'lucide-react';
import { churchData } from '@/data/site-data';

/**
 * Botão flutuante de WhatsApp (referência visual aprovada).
 * Usa o link de churchData (wa.me já formatado). Renderizado no portal e nas páginas de igreja.
 */
export default function WhatsAppFab() {
  const href = churchData.whatsapp;
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-fab"
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle size={26} />
    </a>
  );
}
