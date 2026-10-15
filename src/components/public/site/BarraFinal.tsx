'use client';

import { ChevronUp } from 'lucide-react';

export default function BarraFinal({ nomeOrg }: { nomeOrg: string }) {
  const ano = new Date().getFullYear();
  return (
    <footer className="barraFinal">
      <div className="barraInner">
        <p className="barraTexto">
          © {ano} <strong>{nomeOrg}</strong>. Todos os direitos reservados.
        </p>
        <a
          href="#topo"
          className="barraTopo"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <ChevronUp size={15} /> Voltar ao topo
        </a>
      </div>
    </footer>
  );
}
