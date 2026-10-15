'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import TopBarSite from '@/components/public/site/TopBarSite';
import HeaderSite from '@/components/public/site/HeaderSite';
import HeroSite from '@/components/public/site/HeroSite';
import PilaresSection from '@/components/public/site/PilaresSection';
import EventosAvisosSection from '@/components/public/site/EventosAvisosSection';
import MinisteriosSection from '@/components/public/site/MinisteriosSection';
import RodapeInfoSection from '@/components/public/site/RodapeInfoSection';
import BarraFinal from '@/components/public/site/BarraFinal';
import ProgramacaoPublica from '@/components/public/ProgramacaoPublica';
import PregacoesList from '@/components/public/PregacoesList';
import LiderancaList from '@/components/public/LiderancaList';
import GaleriaGrid from '@/components/public/GaleriaGrid';
import CanaisSection from '@/components/public/CanaisSection';
import ContatoForm from '@/components/public/ContatoForm';
import styles from './page.module.css';

interface IgrejaConfig {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  configuracoes?: {
    nomeIgreja: string;
    logoUrl: string | null;
    logoDarkUrl: string | null;
    faviconUrl: string | null;
    corPrincipal: string;
    corSecundaria: string;
    corDestaque: string;
    corFundo: string;
    corFundoClaro: string;
    corSuperficie: string;
    corTexto: string;
    corTextoSecundario: string;
    corBorda: string;
    tema: string;
    paletaSite?: string;
    anoFundacao: number | null;
    rodapeDescricao: string | null;
    rodapeEndereco: string | null;
    rodapeTelefone: string | null;
    rodapeEmail: string | null;
    rodapeWhatsapp: string | null;
    rodapeYoutube: string | null;
    rodapeInstagram: string | null;
    rodapeFacebook: string | null;
    statMembros: boolean;
    statCongregacoes: boolean;
    statLideres: boolean;
    statAnosHistoria: boolean;
    statMinisterios: boolean;
  } | null;
  paginaPublica?: {
    secaoHero?: {
      exibir?: boolean;
      tipo?: 'IMAGEM' | 'SLIDE' | 'VIDEO';
      imagemUrl?: string;
      videoUrl?: string;
      slides?: { url: string; alt?: string }[];
      sobretitulo?: string;
      titulo?: string;
      subtitulo?: string;
      botaoTexto?: string;
      botaoLink?: string;
    } | null;
    secaoSobre?: { exibir?: boolean; titulo?: string; texto?: string } | null;
    secaoEventos?: { exibir?: boolean } | null;
    secaoLideranca?: { exibir?: boolean } | null;
    secaoGaleria?: { exibir?: boolean } | null;
    secaoContato?: { exibir?: boolean } | null;
    secaoPregacoes?: { exibir?: boolean } | null;
    secaoPilares?: {
      exibir?: boolean;
      itens?: { titulo: string; descricao: string; detalhes?: string }[];
    } | null;
    secaoPalavraDia?: { exibir?: boolean } | null;
    secaoMinisterios?: { exibir?: boolean } | null;
    secaoRodapeInfo?: { exibir?: boolean; horariosCulto?: { dia: string; horario: string }[] } | null;
  } | null;
}

export default function IgrejaHomePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [igreja, setIgreja] = useState<IgrejaConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/church-info?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.organizacao) {
          setIgreja({
            id: d.organizacao.id,
            nome: d.organizacao.nome,
            slug: d.organizacao.slug,
            descricao: d.organizacao.descricao,
            configuracoes: d.configuracoes,
            paginaPublica: d.paginaPublica,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className={styles.siteLoading}>Carregando...</div>;
  }

  if (!igreja) {
    return (
      <div className={styles.siteErro}>
        <h1>Igreja não encontrada</h1>
        <p>A igreja com slug &quot;<code>{slug}</code>&quot; não existe ou está inativa.</p>
        <Link href="/" className={styles.btnPrimary} style={{ marginTop: '2rem', display: 'inline-flex' }}>
          Voltar ao início <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const cfg = igreja.configuracoes;
  const pp = igreja.paginaPublica;

  const heroExibir = pp?.secaoHero?.exibir ?? true;
  const pilaresExibir = pp?.secaoPilares?.exibir ?? true;
  const palavraDiaExibir = pp?.secaoPalavraDia?.exibir ?? true;
  const sobreExibir = pp?.secaoSobre?.exibir ?? true;
  const eventosExibir = pp?.secaoEventos?.exibir ?? true;
  const ministeriosExibir = pp?.secaoMinisterios?.exibir ?? true;
  const rodapeInfoExibir = pp?.secaoRodapeInfo?.exibir ?? true;
  const programacaoExibir = pp?.secaoSobre?.exibir ?? true;
  const pregacoesExibir = pp?.secaoPregacoes?.exibir ?? true;
  const liderancaExibir = pp?.secaoLideranca?.exibir ?? true;
  const galeriaExibir = pp?.secaoGaleria?.exibir ?? true;
  const contatoExibir = pp?.secaoContato?.exibir ?? true;

  const nomeOrg = cfg?.nomeIgreja || igreja.nome;

  return (
    <div className={styles.siteWrapper} id="topo">
      <TopBarSite
        endereco={cfg?.rodapeEndereco}
        telefone={cfg?.rodapeTelefone}
        instagram={cfg?.rodapeInstagram}
        facebook={cfg?.rodapeFacebook}
        youtube={cfg?.rodapeYoutube}
        nomeOrg={nomeOrg}
      />
      <HeaderSite
        slug={slug}
        logoUrl={cfg?.logoUrl}
        nomeIgreja={nomeOrg}
      />

      {heroExibir && (
        <HeroSite
          slug={slug}
          config={pp?.secaoHero || null}
          nomeFallback={igreja.nome}
          descricaoFallback={igreja.descricao}
        />
      )}

      {pilaresExibir && (
        <PilaresSection
          itens={pp?.secaoPilares?.itens || null}
          slug={slug}
          exibirPalavraDia={palavraDiaExibir}
        />
      )}

      {sobreExibir && (
        <section className={styles.sobre} id="sobre">
          <div className={styles.sobreInner}>
            <h2>{pp?.secaoSobre?.titulo || 'Sobre Nós'}</h2>
            <p>
              {pp?.secaoSobre?.texto ||
                igreja.descricao ||
                'Somos uma igreja comprometida com o Evangelho.'}
            </p>
          </div>
        </section>
      )}

      {eventosExibir && <EventosAvisosSection slug={slug} />}

      {programacaoExibir && (
        <section className={styles.secaoExtra} id="programacao">
          <div className={styles.secaoExtraInner}>
            <h2>Programação</h2>
            <ProgramacaoPublica slug={slug} />
          </div>
        </section>
      )}

      {ministeriosExibir && <MinisteriosSection slug={slug} />}

      {pregacoesExibir && (
        <section className={styles.secaoExtra}>
          <div className={styles.secaoExtraInner}>
            <div className={styles.secaoExtraHeader}>
              <h2>Pregações Recentes</h2>
              <Link href={`/igreja/${slug}/pregacoes`} className={styles.verTodos}>
                Ver todas <ArrowRight size={16} />
              </Link>
            </div>
            <PregacoesList slug={slug} limit={3} />
          </div>
        </section>
      )}

      {liderancaExibir && (
        <section className={styles.secaoExtra}>
          <div className={styles.secaoExtraInner}>
            <div className={styles.secaoExtraHeader}>
              <h2>Nossa Liderança</h2>
              <Link href={`/igreja/${slug}/lideranca`} className={styles.verTodos}>
                Ver todos <ArrowRight size={16} />
              </Link>
            </div>
            <LiderancaList slug={slug} limit={4} />
          </div>
        </section>
      )}

      {galeriaExibir && (
        <section className={styles.secaoExtra}>
          <div className={styles.secaoExtraInner}>
            <div className={styles.secaoExtraHeader}>
              <h2>Galeria</h2>
              <Link href={`/igreja/${slug}/galeria`} className={styles.verTodos}>
                Ver mais <ArrowRight size={16} />
              </Link>
            </div>
            <GaleriaGrid slug={slug} limit={6} />
          </div>
        </section>
      )}

      <CanaisSection slug={slug} />

      {contatoExibir && (
        <section className={styles.secaoExtra} id="contato-form">
          <div className={styles.secaoExtraInner}>
            <h2>Contato</h2>
            <ContatoForm slug={slug} />
          </div>
        </section>
      )}

      {rodapeInfoExibir && (
        <RodapeInfoSection
          nomeOrg={nomeOrg}
          endereco={cfg?.rodapeEndereco}
          telefone={cfg?.rodapeTelefone}
          whatsapp={cfg?.rodapeWhatsapp}
          email={cfg?.rodapeEmail}
          instagram={cfg?.rodapeInstagram}
          facebook={cfg?.rodapeFacebook}
          youtube={cfg?.rodapeYoutube}
          horariosCulto={pp?.secaoRodapeInfo?.horariosCulto}
        />
      )}

      <BarraFinal nomeOrg={nomeOrg} />
    </div>
  );
}
