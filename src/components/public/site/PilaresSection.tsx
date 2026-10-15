'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Users, Heart, HandHeart, Quote, X, type LucideIcon } from 'lucide-react';
import {
  temaDoPilar,
  versiculoDoTema,
  type TemaPilar,
  type VersiculoTema,
} from '@/data/versiculos-temas';

export interface PilarItem {
  titulo: string;
  descricao: string;
  detalhes?: string;
}

interface PilaresSectionProps {
  itens?: PilarItem[] | null;
  slug?: string;
  exibirPalavraDia?: boolean;
}

interface VersiculoDiaApi extends VersiculoTema {
  id?: string;
}

const PILARES_PADRAO: PilarItem[] = [
  {
    titulo: 'Palavra de Deus',
    descricao: 'Estudo, ensino e vida com propósito.',
    detalhes:
      'A Bíblia é o fundamento de tudo o que cremos e praticamos. Em cultos, escolas bíblicas e grupos familiares, estudamos as Escrituras para conhecer a Deus, ser transformados e viver com sabedoria. Aqui a Palavra não é apenas ouvida — é vivida no dia a dia.',
  },
  {
    titulo: 'Palavra do Dia',
    descricao: 'Um versículo para fortalecer o seu dia.',
    detalhes:
      'Todo dia há uma palavra especial esperando por você. Ao clicar aqui, você encontra o versículo do dia com uma reflexão para guardar no coração e levar consigo ao longo da semana.',
  },
  {
    titulo: 'Comunhão',
    descricao: 'Juntos na fé, no amor e na missão.',
    detalhes:
      'Somos família na fé. A comunhão acontece nos cultos, nos grupos pequenos, nas reuniões de oração e nos encontros sociais. Caminhamos juntos, suportamos uns aos outros e nos fortalecemos no amor, mantendo a unidade que Cristo conquistou.',
  },
  {
    titulo: 'Adoração',
    descricao: 'Um coração que exalta a Jesus.',
    detalhes:
      'Adorar é mais do que cantar: é entregar a vida inteira a Jesus. Nos nossos cultos, a presença de Deus é o centro. Louvamos com excelência, buscamos a face do Senhor e permitimos que o Espírito Santo transforme cada coração.',
  },
];

const ICONES: Record<TemaPilar, LucideIcon> = {
  palavra: BookOpen,
  palavraDoDia: Quote,
  comunhao: Users,
  adoracao: Heart,
  servico: HandHeart,
  geral: BookOpen,
};

function timeUntil(proximoEm: string, agora: number): string {
  const diff = new Date(proximoEm).getTime() - agora;
  if (diff <= 0) return 'em breve';
  const horas = Math.floor(diff / (1000 * 60 * 60));
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return horas > 0 ? `${horas}h ${minutos}min` : `${minutos}min`;
}

export default function PilaresSection({ itens, slug, exibirPalavraDia = true }: PilaresSectionProps) {
  const [aberto, setAberto] = useState<number | null>(null);
  const [versos, setVersos] = useState<VersiculoTema[]>([]);
  const [versoDia, setVersoDia] = useState<VersiculoDiaApi | null>(null);
  const [proximoEm, setProximoEm] = useState('');
  const [agora, setAgora] = useState(() => Date.now());

  const base = itens && itens.length > 0 ? itens : PILARES_PADRAO;
  const pilares = useMemo(
    () => (exibirPalavraDia ? base : base.filter((p) => temaDoPilar(p.titulo) !== 'palavraDoDia')),
    [base, exibirPalavraDia],
  );

  useEffect(() => {
    setVersos(pilares.map((p) => versiculoDoTema(temaDoPilar(p.titulo))));

    const temPalavraDoDia = pilares.some((p) => temaDoPilar(p.titulo) === 'palavraDoDia');
    if (!temPalavraDoDia) {
      setVersoDia(null);
      setProximoEm('');
      return;
    }

    let cancelado = false;
    const qs = slug ? `?slug=${encodeURIComponent(slug)}` : '';
    fetch(`/api/public/versiculo${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelado || !data?.versiculo) return;
        setVersoDia(data.versiculo);
        setProximoEm(data.proximoEm || '');
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [pilares, slug]);

  useEffect(() => {
    if (!proximoEm) return;
    const id = setInterval(() => setAgora(Date.now()), 60000);
    return () => clearInterval(id);
  }, [proximoEm]);

  useEffect(() => {
    if (aberto === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberto(null);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [aberto]);

  const pilar = aberto !== null && aberto < pilares.length ? pilares[aberto] : null;
  const temaAberto: TemaPilar | null = pilar ? temaDoPilar(pilar.titulo) : null;
  const IconeModal = pilar ? ICONES[temaAberto as TemaPilar] : null;
  const versoAberto: VersiculoTema | null =
    pilar && aberto !== null
      ? temaAberto === 'palavraDoDia' && versoDia
        ? versoDia
        : versos[aberto] || null
      : null;
  const countdown =
    pilar && temaAberto === 'palavraDoDia' && proximoEm ? timeUntil(proximoEm, agora) : '';

  return (
    <section className="pilares" aria-label="Nossos valores">
      <div className="pilaresGrid">
        {pilares.map((p, i) => {
          const tema = temaDoPilar(p.titulo);
          const Icone = ICONES[tema];
          const verso =
            tema === 'palavraDoDia' && versoDia ? versoDia : versos[i] || null;
          return (
            <button
              key={`${p.titulo}-${i}`}
              type="button"
              className="pilar"
              onClick={() => setAberto(i)}
              aria-haspopup="dialog"
            >
              <div className="pilarIcon"><Icone size={36} strokeWidth={1.8} /></div>
              <h3>{p.titulo}</h3>
              {verso ? (
                <div className="pilarVersiculo">
                  <span className="pilarVersiculoRef">{verso.referencia}</span>
                  <p className="pilarVersiculoTexto">&ldquo;{verso.versiculo}&rdquo;</p>
                </div>
              ) : (
                <p>{p.descricao}</p>
              )}
              <span className="pilarSaibaMais">Saiba mais</span>
            </button>
          );
        })}
      </div>

      {pilar && (
        <div
          className="pilarModalBackdrop"
          onClick={() => setAberto(null)}
          role="presentation"
        >
          <div
            className="pilarModal"
            role="dialog"
            aria-modal="true"
            aria-label={pilar.titulo}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="pilarModalClose"
              onClick={() => setAberto(null)}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
            <div className="pilarModalIcon">
              {IconeModal && <IconeModal size={32} strokeWidth={1.8} />}
            </div>
            <h3>{pilar.titulo}</h3>
            <p className="pilarModalDescricao">{pilar.descricao}</p>
            {pilar.detalhes && <p className="pilarModalDetalhes">{pilar.detalhes}</p>}
            {versoAberto && (
              <div className="pilarModalVersiculo">
                <span className="pilarModalVersiculoLabel">
                  <Quote size={13} strokeWidth={2.4} />
                  {temaAberto === 'palavraDoDia' ? 'Palavra do Dia' : 'Versículo do tema'}
                </span>
                <p className="pilarModalVersiculoRef">{versoAberto.referencia}</p>
                <p className="pilarModalVersiculoTexto">&ldquo;{versoAberto.versiculo}&rdquo;</p>
                <div className="pilarModalVersiculoReflexao">
                  <span className="pilarModalVersiculoReflexaoLabel">Reflexão</span>
                  <p>{versoAberto.reflexao}</p>
                </div>
                {countdown && (
                  <p className="pilarModalVersiculoCountdown">Próximo versículo em {countdown}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
