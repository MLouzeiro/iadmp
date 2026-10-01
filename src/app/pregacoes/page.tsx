import type { Metadata } from 'next';
import PregacoesList from '@/components/public/PregacoesList';

export const metadata: Metadata = {
  title: 'Pregacoes - IADMP',
  description: 'Mensagens pregadas na Igreja Assembleia de Deus Missao da Promessa.',
};

export default function PregacoesPage() {
  return <PregacoesList />;
}
