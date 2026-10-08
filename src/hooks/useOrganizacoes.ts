'use client';

import { useState, useEffect } from 'react';

export interface Organizacao {
  id: string;
  nome: string;
}

/**
 * Busca as organizações do usuário logado.
 * - `multiOrg` é true quando há mais de uma opção (o form precisa exibir o seletor).
 * - Com uma única organização, o backend resolve automaticamente via resolveTargetOrgId.
 */
export function useOrganizacoes() {
  const [orgs, setOrgs] = useState<Organizacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/organizacoes')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        const list = Array.isArray(d) ? d : d?.organizacoes || [];
        setOrgs(list);
      })
      .catch(() => setOrgs([]))
      .finally(() => setLoading(false));
  }, []);

  return { orgs, loading, multiOrg: orgs.length > 1 };
}
