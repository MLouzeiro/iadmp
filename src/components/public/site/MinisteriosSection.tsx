'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Music, BookOpen, Heart, Baby, Home, ArrowRight } from 'lucide-react';

interface Ministerio {
  id: string;
  nome: string;
  descricao?: string | null;
}

const ICONES: Record<string, React.ElementType> = {
  louvor: Music,
  adoração: Music,
  adoracao: Music,
  ensino: BookOpen,
  escola: BookOpen,
  diaconia: Heart,
  diacono: Heart,
  jovens: Users,
  juvenil: Users,
  infantil: Baby,
  criancas: Baby,
  família: Home,
  familia: Home,
};

function iconePara(nome: string): React.ElementType {
  const chave = nome.toLowerCase();
  for (const [key, Icone] of Object.entries(ICONES)) {
    if (chave.includes(key)) return Icone;
  }
  return Users;
}

export default function MinisteriosSection({ slug }: { slug: string }) {
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);

  useEffect(() => {
    fetch(`/api/public/ministerios?slug=${slug}`)
      .then((r) => (r.ok ? r.json() : { ministerios: [] }))
      .then((d) => setMinisterios(d.ministerios || []))
      .catch(() => setMinisterios([]));
  }, [slug]);

  if (ministerios.length === 0) return null;

  return (
    <section className="ministerios" id="ministerios" aria-label="Ministérios">
      <div className="ministeriosGrid">
        <div>
          <div className="ministeriosEyebrow">
            <Users size={18} /> Nossos Ministérios
          </div>
          <h2 className="ministeriosTitle">Servindo a Deus com<br />os nossos dons</h2>
          <p className="ministeriosDesc">
            Conheça os ministérios que fazem parte da nossa congregação e encontre o seu lugar na obra do Senhor.
          </p>
          <Link href={`/igreja/${slug}#ministerios`} className="ministeriosBtn">
            Conheça os ministérios <ArrowRight size={16} />
          </Link>
        </div>
        <div className="tiles">
          {ministerios.slice(0, 6).map((m) => {
            const Icone = iconePara(m.nome);
            return (
              <div key={m.id} className="tile">
                <Icone size={28} strokeWidth={1.8} />
                <span>{m.nome}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
