'use client';

import { useEffect, useState } from 'react';

interface HeroStatsData {
  membros?: number;
  congregacoes?: number;
  lideres?: number;
  anosHistoria?: number;
  ministerios?: number;
  exibir?: {
    membros?: boolean;
    congregacoes?: boolean;
    lideres?: boolean;
    anosHistoria?: boolean;
    ministerios?: boolean;
  };
}

const FALLBACK: Required<HeroStatsData> = {
  membros: 0,
  congregacoes: 5,
  lideres: 11,
  anosHistoria: 12,
  ministerios: 3,
  exibir: {
    membros: false,
    congregacoes: true,
    lideres: true,
    anosHistoria: true,
    ministerios: true,
  },
};

type StatKey = 'congregacoes' | 'lideres' | 'anosHistoria' | 'ministerios' | 'membros';

const STAT_LABELS: Record<StatKey, string> = {
  congregacoes: 'Congregações',
  lideres: 'Líderes',
  anosHistoria: 'Anos de História',
  ministerios: 'Ministérios de Louvor',
  membros: 'Membros',
};

const STAT_ORDER: StatKey[] = ['congregacoes', 'lideres', 'anosHistoria', 'ministerios', 'membros'];

/**
 * Estatísticas do hero da home — dados de /api/public/hero-stats.
 * Sem conexão/config, reproduz os valores fixos hoje em produção (5/11/12/3).
 */
export default function HeroStats() {
  const [stats, setStats] = useState<HeroStatsData>(FALLBACK);

  useEffect(() => {
    let cancelado = false;
    fetch('/api/public/hero-stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: HeroStatsData | null) => {
        if (cancelado || !d || typeof d.congregacoes !== 'number') return;
        setStats({
          membros: typeof d.membros === 'number' ? d.membros : FALLBACK.membros,
          congregacoes: d.congregacoes,
          lideres: typeof d.lideres === 'number' ? d.lideres : FALLBACK.lideres,
          anosHistoria: typeof d.anosHistoria === 'number' ? d.anosHistoria : FALLBACK.anosHistoria,
          ministerios: typeof d.ministerios === 'number' ? d.ministerios : FALLBACK.ministerios,
          exibir: {
            membros: d.exibir?.membros ?? FALLBACK.exibir.membros,
            congregacoes: d.exibir?.congregacoes ?? FALLBACK.exibir.congregacoes,
            lideres: d.exibir?.lideres ?? FALLBACK.exibir.lideres,
            anosHistoria: d.exibir?.anosHistoria ?? FALLBACK.exibir.anosHistoria,
            ministerios: d.exibir?.ministerios ?? FALLBACK.exibir.ministerios,
          },
        });
      })
      .catch(() => undefined);
    return () => {
      cancelado = true;
    };
  }, []);

  const exibir = stats.exibir ?? FALLBACK.exibir;
  const visiveis = STAT_ORDER.filter((key) => exibir[key]);

  if (visiveis.length === 0) return null;

  return (
    <div className="hero-stats">
      {visiveis.map((key) => (
        <div key={key} className="hero-stat">
          <span className="hero-stat-value">{stats[key] ?? 0}</span>
          <span className="hero-stat-label">{STAT_LABELS[key]}</span>
        </div>
      ))}
    </div>
  );
}
