'use client';

import { useEffect, useState } from 'react';
import { churchData, socialLinks } from '@/data/site-data';
import TopBarSite from '@/components/public/site/TopBarSite';
import HeaderSite from '@/components/public/site/HeaderSite';
import HeroSite from '@/components/public/site/HeroSite';
import PilaresSection from '@/components/public/site/PilaresSection';
import EventosAvisosSection from '@/components/public/site/EventosAvisosSection';
import MinisteriosSection from '@/components/public/site/MinisteriosSection';
import RodapeInfoSection from '@/components/public/site/RodapeInfoSection';
import BarraFinal from '@/components/public/site/BarraFinal';
import CongregacoesPublicas from '@/components/public/CongregacoesPublicas';
import ProgramacaoPublica from '@/components/public/ProgramacaoPublica';

const slugPortal = 'iadmp-igreja-assembleia-de-deus-ministerio-da-promessa';

interface ChurchConfig {
  nomeIgreja?: string;
  logoUrl?: string | null;
  rodapeEndereco?: string | null;
  rodapeTelefone?: string | null;
  rodapeWhatsapp?: string | null;
  rodapeEmail?: string | null;
}

interface ChurchInfo {
  nome: string;
  descricao: string | null;
  configuracoes: ChurchConfig | null;
  paginaPublica?: {
    secaoPilares?: {
      exibir?: boolean;
      itens?: { titulo: string; descricao: string; detalhes?: string }[];
    } | null;
    secaoPalavraDia?: { exibir?: boolean } | null;
    secaoRodapeInfo?: {
      exibir?: boolean;
      horariosCulto?: { dia: string; horario: string }[];
    } | null;
  } | null;
}

export default function Home() {
  const [igreja, setIgreja] = useState<ChurchInfo | null>(null);

  useEffect(() => {
    fetch(`/api/public/church-info?slug=${slugPortal}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.organizacao) {
          setIgreja({
            nome: d.organizacao.nome,
            descricao: d.organizacao.descricao,
            configuracoes: d.configuracoes,
            paginaPublica: d.paginaPublica,
          });
        }
      })
      .catch(() => {});
  }, []);

  const cfg = igreja?.configuracoes;
  const pp = igreja?.paginaPublica;
  const nomeOrg = cfg?.nomeIgreja || 'IADMP — Assembleia de Deus';
  const pilaresExibir = pp?.secaoPilares?.exibir ?? true;
  const palavraDiaExibir = pp?.secaoPalavraDia?.exibir ?? true;

  const instagram = socialLinks.find((s) => s.name === 'Instagram')?.url;
  const facebook = socialLinks.find((s) => s.name === 'Facebook')?.url;
  const youtube = socialLinks.find((s) => s.name === 'YouTube')?.url;

  return (
    <div className="siteWrapper" id="topo">
      <TopBarSite
        endereco={cfg?.rodapeEndereco || churchData.address}
        telefone={cfg?.rodapeTelefone || churchData.phone}
        instagram={instagram}
        facebook={facebook}
        youtube={youtube}
        nomeOrg={nomeOrg}
      />
      <HeaderSite slug={slugPortal} logoUrl={cfg?.logoUrl} nomeIgreja={nomeOrg} />

      <HeroSite
        slug={slugPortal}
        config={null}
        nomeFallback="IADMP — Missão da Promessa"
        descricaoFallback="Igreja de fé, amor e esperança, onde cada pessoa é acolhida e transformada pelo poder de Deus."
      />

      {pilaresExibir && (
        <PilaresSection
          itens={pp?.secaoPilares?.itens || null}
          slug={slugPortal}
          exibirPalavraDia={palavraDiaExibir}
        />
      )}

      {/* Sobre */}
      <section className="sobre" id="sobre">
        <div className="sobreInner">
          <h2>Sobre Nós</h2>
          <p>
            {igreja?.descricao ||
              'Somos uma igreja comprometida com o Evangelho, uma comunidade de fé, amor e esperança onde cada pessoa é acolhida e transformada pelo poder de Deus.'}
          </p>
        </div>
      </section>

      <EventosAvisosSection slug={slugPortal} />

      {/* Programação */}
      <section className="secaoExtra" id="programacao">
        <div className="secaoExtraInner">
          <h2>Programação</h2>
          <ProgramacaoPublica slug={slugPortal} />
        </div>
      </section>

      <MinisteriosSection slug={slugPortal} />

      {/* Congregações */}
      <section className="secaoExtra">
        <div className="secaoExtraInner">
          <h2>Nossas Congregações</h2>
          <CongregacoesPublicas />
        </div>
      </section>

      <RodapeInfoSection
        nomeOrg={nomeOrg}
        endereco={cfg?.rodapeEndereco || churchData.address}
        telefone={cfg?.rodapeTelefone || churchData.phone}
        whatsapp={cfg?.rodapeWhatsapp}
        email={cfg?.rodapeEmail || churchData.email}
        instagram={instagram}
        facebook={facebook}
        youtube={youtube}
        horariosCulto={pp?.secaoRodapeInfo?.horariosCulto}
      />

      <BarraFinal nomeOrg={nomeOrg} />
    </div>
  );
}
