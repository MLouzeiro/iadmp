'use client';

import { useState, useEffect, useCallback } from 'react';

interface VersiculoData {
  id: string;
  referencia: string;
  versiculo: string;
  reflexao: string;
}

interface VerseResponse {
  versiculo: VersiculoData | null;
  proximoEm: string;
  slot: number;
}

function getTimeUntilNext(proximoEm: string): string {
  const now = Date.now();
  const target = new Date(proximoEm).getTime();
  const diff = target - now;

  if (diff <= 0) return 'Atualizando...';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

export default function VerseOfTheDay({ organizacaoId }: { organizacaoId: string }) {
  const [verse, setVerse] = useState<VersiculoData | null>(null);
  const [proximoEm, setProximoEm] = useState('');
  const [countdown, setCountdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const fetchVerse = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/versiculo?organizacaoId=${organizacaoId}`);
      if (res.ok) {
        const data: VerseResponse = await res.json();
        if (data.versiculo) {
          setFadeOut(true);
          setTimeout(() => {
            setVerse(data.versiculo);
            setProximoEm(data.proximoEm);
            setFadeOut(false);
          }, 300);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar versiculo:', err);
    } finally {
      setLoading(false);
    }
  }, [organizacaoId]);

  useEffect(() => {
    fetchVerse();
  }, [fetchVerse]);

  useEffect(() => {
    if (!proximoEm) return;

    const interval = setInterval(() => {
      setCountdown(getTimeUntilNext(proximoEm));
    }, 60000);

    setCountdown(getTimeUntilNext(proximoEm));

    return () => clearInterval(interval);
  }, [proximoEm]);

  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchVerse();
    }, 5 * 60 * 1000);

    return () => clearInterval(pollInterval);
  }, [fetchVerse]);

  if (loading) {
    return (
      <section className="verse-section">
        <div className="container">
          <div className="section-heading">
            <span className="label">Versiculo do Momento</span>
            <div className="divider" />
          </div>
          <div className="verse-card">
            <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!verse) {
    return null;
  }

  return (
    <section className="verse-section">
      <div className="container">
        <div className="section-heading">
          <span className="label">Versiculo do Momento</span>
          <div className="divider" />
        </div>
        <div className={`verse-card fade-in ${fadeOut ? 'verse-fade-out' : ''}`}>
          <p className="reference">{verse.referencia}</p>
          <p className="text">&ldquo;{verse.versiculo}&rdquo;</p>
          <div className="reflection">
            <span className="reflection-label">Reflexao</span>
            {verse.reflexao}
          </div>
          {countdown && (
            <div className="verse-countdown">
              Proximo versiculo em {countdown}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
