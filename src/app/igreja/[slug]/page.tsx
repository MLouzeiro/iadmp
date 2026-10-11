'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowRight, Heart, Calendar, Users, BookOpen, Music, MapPin, Phone, Mail, Send, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import HeroStats from '@/components/public/HeroStats';
import BannerCarousel from '@/components/public/BannerCarousel';
import VerseOfTheDay from '@/components/public/VerseOfTheDay';
import EventosList from '@/components/public/EventosList';
import PregacoesList from '@/components/public/PregacoesList';
import LiderancaList from '@/components/public/LiderancaList';
import ContatoForm from '@/components/public/ContatoForm';
import GaleriaGrid from '@/components/public/GaleriaGrid';
import CanaisSection from '@/components/public/CanaisSection';
import ChurchInfo from '@/components/public/ChurchInfo';
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
    secaoHero: any;
    secaoSobre: any;
    secaoEventos: any;
    secaoLideranca: any;
    secaoGaleria: any;
    secaoContato: any;
    secaoPregacoes: any;
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
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className={styles.loading}>Carregando...</div>
      </div>
    );
  }

  if (!igreja) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h1 style={{ color: 'var(--text-primary)' }}>Igreja não encontrada</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>A igreja com slug "<code>{slug}</code>" não existe ou está inativa.</p>
        <Link href="/" style={{ marginTop: '2rem', display: 'inline-block' }}>
          <button className={styles.btnPrimary}><ArrowRight size={16} /> Voltar ao início</button>
        </Link>
      </div>
    );
  }

  const hero = igreja.paginaPublica?.secaoHero || { titulo: 'Bem-vindos à nossa Igreja', subtitulo: 'Uma comunidade de fé, amor e esperança' };
  const sobre = igreja.paginaPublica?.secaoSobre || { titulo: 'Sobre Nós', texto: 'Somos uma igreja comprometida com o Evangelho.' };
  const exibirEventos = igreja.paginaPublica?.secaoEventos?.exibir ?? true;
  const exibirLideranca = igreja.paginaPublica?.secaoLideranca?.exibir ?? true;
  const exibirGaleria = igreja.paginaPublica?.secaoGaleria?.exibir ?? true;
  const exibirContato = igreja.paginaPublica?.secaoContato?.exibir ?? true;
  const exibirPregacoes = igreja.paginaPublica?.secaoPregacoes?.exibir ?? true;

  return (
    <>
      <BannerCarousel slug={slug} />

      <section className={styles.hero} style={{ backgroundImage: `url(${igreja.configuracoes?.logoDarkUrl || '/images/iadmp/Slide/image1.jpg'})` }}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1>{hero.titulo || igreja.nome}</h1>
          <p>{hero.subtitulo || igreja.descricao || 'Uma comunidade de fé, amor e esperança.'}</p>
          <div className={styles.heroButtons}>
            <Link href={`/igreja/${slug}/eventos`} className={styles.btnPrimary}>
              Próximos Eventos <ArrowRight size={16} />
            </Link>
            <Link href={`/igreja/${slug}/contato`} className={styles.btnOutline}>
              Fale Conosco
            </Link>
          </div>
        </div>
      </section>

      <HeroStats slug={slug} />

      <section className={styles.section}>
        <VerseOfTheDay slug={slug} />
      </section>

      {exibirEventos && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Próximos Eventos</h2>
            <Link href={`/igreja/${slug}/eventos`} className={styles.verTodos}>
              Ver todos <ArrowRight size={16} />
            </Link>
          </div>
          <EventosList slug={slug} limit={4} />
        </section>
      )}

      {exibirPregacoes && (
        <section className={styles.section} style={{ background: 'var(--bg-secondary)' }}>
          <div className={styles.sectionHeader}>
            <h2>Pregações Recentes</h2>
            <Link href={`/igreja/${slug}/pregacoes`} className={styles.verTodos}>
              Ver todas <ArrowRight size={16} />
            </Link>
          </div>
          <PregacoesList slug={slug} limit={3} />
        </section>
      )}

      {exibirLideranca && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Nossa Liderança</h2>
            <Link href={`/igreja/${slug}/lideranca`} className={styles.verTodos}>
              Ver todos <ArrowRight size={16} />
            </Link>
          </div>
          <LiderancaList slug={slug} limit={4} />
        </section>
      )}

      {exibirGaleria && (
        <section className={styles.section} style={{ background: 'var(--bg-secondary)' }}>
          <div className={styles.sectionHeader}>
            <h2>Galeria</h2>
            <Link href={`/igreja/${slug}/galeria`} className={styles.verTodos}>
              Ver mais <ArrowRight size={16} />
            </Link>
          </div>
          <GaleriaGrid slug={slug} limit={6} />
        </section>
      )}

      <CanaisSection slug={slug} />

      {exibirContato && (
        <section className={styles.section} style={{ background: 'var(--bg-secondary)' }}>
          <div className={styles.sectionHeader}>
            <h2>Contato</h2>
          </div>
          <ContatoForm slug={slug} />
        </section>
      )}

      <footer className={styles.churchFooter}>
        <div className={styles.footerGrid}>
          <div>
            <h3>{igreja.configuracoes?.nomeIgreja || igreja.nome}</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              {igreja.descricao || 'Uma comunidade de fé, amor e esperança.'}
            </p>
          </div>
          <div>
            <h3>Endereço</h3>
            {igreja.configuracoes?.rodapeEndereco && (
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                {igreja.configuracoes.rodapeEndereco}
              </p>
            )}
            {igreja.configuracoes?.rodapeTelefone && (
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <Phone size={14} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                {igreja.configuracoes.rodapeTelefone}
              </p>
            )}
            {igreja.configuracoes?.rodapeEmail && (
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <Mail size={14} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                {igreja.configuracoes.rodapeEmail}
              </p>
            )}
            {igreja.configuracoes?.rodapeWhatsapp && (
              <a href={igreja.configuracoes.rodapeWhatsapp} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none' }}>
                <MessageSquare size={14} /> WhatsApp
              </a>
            )}
          </div>
          <div>
            <h3>Redes Sociais</h3>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              {igreja.configuracoes?.rodapeYoutube && (
                <a href={igreja.configuracoes.rodapeYoutube} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }}>
                  <Radio size={20} />
                </a>
              )}
              {igreja.configuracoes?.rodapeInstagram && (
                <a href={igreja.configuracoes.rodapeInstagram} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }}>
                  <Radio size={20} />
                </a>
              )}
              {igreja.configuracoes?.rodapeFacebook && (
                <a href={igreja.configuracoes.rodapeFacebook} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }}>
                  <Radio size={20} />
                </a>
              )}
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} {igreja.configuracoes?.nomeIgreja || igreja.nome}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
      </>
    );
  }