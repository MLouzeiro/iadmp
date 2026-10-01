'use client';

import { useState, useEffect } from 'react';

interface ChurchInfo {
  organizacaoId: string | null;
}

export function useChurchInfo() {
  const [info, setInfo] = useState<ChurchInfo>({ organizacaoId: null });

  useEffect(() => {
    async function fetchInfo() {
      try {
        const res = await fetch('/api/public/church-info');
        if (res.ok) {
          const data = await res.json();
          setInfo(data);
        }
      } catch {
        console.error('Erro ao buscar info da igreja');
      }
    }
    fetchInfo();
  }, []);

  return info;
}
