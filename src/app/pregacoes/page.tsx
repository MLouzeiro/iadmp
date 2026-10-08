import type { Metadata } from 'next';
import PregacoesList from '@/components/public/PregacoesList';

export const metadata: Metadata = {
  title: 'Pregações - IADMP',
  description: 'Mensagens pregadas na Igreja Assembleia de Deus Missão da Promessa.',
};

export default function PregacoesPage() {
  return <PregacoesList />;
}
