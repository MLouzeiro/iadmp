'use client';

import { useChurchInfo } from './ChurchInfo';
import VerseOfTheDay from './VerseOfTheDay';
import PregacoesSection from './PregacoesSection';
import CanaisSection from './CanaisSection';
import EventosSection from './EventosSection';
import AvisosPublicos from './AvisosPublicos';

export default function PublicSections() {
  const { organizacaoId } = useChurchInfo();

  if (!organizacaoId) return null;

  return (
    <>
      <VerseOfTheDay organizacaoId={organizacaoId} />
      <div className="pub-eventos-grid container" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
        <EventosSection organizacaoId={organizacaoId} />
        <AvisosPublicos organizacaoId={organizacaoId} />
      </div>
      <PregacoesSection organizacaoId={organizacaoId} />
      <CanaisSection organizacaoId={organizacaoId} />
    </>
  );
}
