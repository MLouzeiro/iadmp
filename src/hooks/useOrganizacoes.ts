'use client';

import { useState, useEffect } from 'react';

export interface Organizacao {
  id: string;
  nome: string;
}

/**
 * Busca as organiza\u00e7\u00f5es do usu\u00e1rio logado.
 * - `multiOrg` \u00e9 true quando h\u00e1 mais de uma op\u00e7\u00e3o (o form precisa exibir o seletor).
 * - Com uma \u00fanica organiza\u00e7\u00e3o, o backend resolve automaticamente via resolveTargetOrgId.
 * - `loading` indica que a lista ainda n\u00e3o chegou (bloquear submit nesse per\u00edodo).
 */
export function useOrganizacoes() {
  const [orgs, setOrgs] = useState<Organizacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/organizacoes')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (cancelled) return;
        const list = Array.isArray(d) ? d : d?.organizacoes || [];
        setOrgs(list);
      })
      .catch(() => {
        if (!cancelled) setOrgs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { orgs, loading, multiOrg: orgs.length > 1 };
}
