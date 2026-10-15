'use client';

import { useState, useEffect } from 'react';

export interface Organizacao {
  id: string;
  nome: string;
  slug?: string | null;
}

/**
 * Busca as organiza\u00e7\u00f5es do usu\u00e1rio logado.
 * - `multiOrg` \u00e9 true quando h\u00e1 mais de uma op\u00e7\u00e3o (o form precisa exibir o seletor).
 * - Com uma \u00fanica organiza\u00e7\u00e3o, o backend resolve automaticamente via resolveTargetOrgId.
 * - `loading` indica que a lista ainda n\u00e3o chegou (bloquear submit nesse per\u00edodo).
 * - `orgAtualId` reflete a organiza\u00e7\u00e3o selecionada na sidebar (localStorage `iadmp-current-org`),
 *   com fallback para a primeira da lista. \u00c9 o valor que forms devem enviar por padr\u00e3o.
 */
export function useOrganizacoes() {
  const [orgs, setOrgs] = useState<Organizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgAtualId, setOrgAtualId] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/organizacoes')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (cancelled) return;
        const list = Array.isArray(d) ? d : d?.organizacoes || [];
        setOrgs(list);
        if (list.length > 0) {
          const stored = localStorage.getItem('iadmp-current-org');
          const current = stored && list.some((o: Organizacao) => o.id === stored) ? stored : list[0].id;
          setOrgAtualId(current);
        }
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

  return { orgs, loading, multiOrg: orgs.length > 1, orgAtualId };
}
