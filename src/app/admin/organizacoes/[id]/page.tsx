'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Building2, Users, UserCheck, Calendar, DollarSign, Edit, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import PageHead from '@/components/ui/PageHead';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import styles from '@/components/ui/form.module.css';

interface OrganizacaoDetalhe {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  ativo: boolean;
  dominioPersonalizado: string | null;
  createdAt: string;
  updatedAt: string;
  configuracoes?: {
    nomeIgreja: string;
    logoUrl: string | null;
    corPrincipal: string;
    rodapeEndereco: string | null;
    rodapeTelefone: string | null;
    rodapeEmail: string | null;
    rodapeWhatsapp: string | null;
    rodapeYoutube: string | null;
    rodapeInstagram: string | null;
    rodapeFacebook: string | null;
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
  _count: {
    usuarios: number;
    membros: number;
    liderancas: number;
    eventos: number;
    congregacoes: number;
  };
}

export default function OrganizacaoDetalhePage() {
  const params = useParams();
  const { toast } = useToast();
  const [org, setOrg] = useState<OrganizacaoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/organizacoes/${params.id}`)
      .then((r) => r.json())
      .then((d) => setOrg(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleToggleAtivo = async () => {
    if (!org) return;
    const res = await fetch(`/api/organizacoes/${org.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !org.ativo }),
    });
    if (res.ok) {
      toast(org.ativo ? 'Organização desativada.' : 'Organização ativada.', 'ok');
      setOrg({ ...org, ativo: !org.ativo });
    } else {
      toast('Erro ao alterar status.', 'err');
    }
  };

  if (loading) {
    return <div className={styles.loadingState}>Carregando organização...</div>;
  }

  if (!org) {
    return (
      <div>
        <PageHead title="Organização não encontrada" actions={<Link href="/admin/organizacoes"><Button variant="secondary" icon={<ArrowLeft size={16} />}>Voltar</Button></Link>} />
        <div style={{ textAlign: 'center', padding: '3rem' }}>Organização não encontrada.</div>
      </div>
    );
  }

  const urlPublica = typeof window !== 'undefined' ? `${window.location.origin}/igreja/${org.slug}` : '';

  return (
    <div>
      <PageHead
        title={org.nome}
        subtitle={`Slug: ${org.slug} · ${org.ativo ? 'Ativa' : 'Inativa'}`}
        actions={
          <>
            {urlPublica && (
              <Button variant="secondary" icon={<ExternalLink size={16} />} onClick={() => window.open(urlPublica, '_blank')}>
                Ver Site Público
              </Button>
            )}
            <Button icon={<Edit size={16} />} onClick={() => {}}>Editar</Button>
            <Link href="/admin/organizacoes"><Button variant="secondary" icon={<ArrowLeft size={16} />}>Voltar</Button></Link>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</p>
          <Badge variant={org.ativo ? 'success' : 'error'} style={{ fontSize: '0.9rem' }}>
            {org.ativo ? 'ATIVA' : 'INATIVA'}
          </Badge>
          <Button size="sm" variant="secondary" onClick={handleToggleAtivo} style={{ marginTop: '0.5rem', width: '100%' }}>
            {org.ativo ? 'Desativar' : 'Ativar'}
          </Button>
        </div>

        <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Usuários</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{org._count.usuarios}</p>
        </div>

        <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Membros</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{org._count.membros}</p>
        </div>

        <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Líderes</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{org._count.liderancas}</p>
        </div>

        <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Eventos</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{org._count.eventos}</p>
        </div>

        <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Congregações</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{org._count.congregacoes}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        <div style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={20} style={{ color: 'var(--color-primary)' }} />
            Informações Básicas
          </h3>
          <dl style={{ display: 'grid', gap: '0.75rem' }}>
            <div><dt style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Nome</dt><dd style={{ fontWeight: 500 }}>{org.nome}</dd></div>
            <div><dt style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Slug</dt><dd style={{ fontWeight: 500, fontFamily: 'monospace' }}>{org.slug}</dd></div>
            <div><dt style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>URL Pública</dt><dd style={{ fontWeight: 500, fontFamily: 'monospace', wordBreak: 'break-all' }}>{urlPublica || '—'}</dd></div>
            <div><dt style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Domínio Personalizado</dt><dd style={{ fontWeight: 500 }}>{org.dominioPersonalizado || '—'}</dd></div>
            <div><dt style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Descrição</dt><dd style={{ fontWeight: 500 }}>{org.descricao || '—'}</dd></div>
            <div><dt style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Criada em</dt><dd style={{ fontWeight: 500 }}>{new Date(org.createdAt).toLocaleString('pt-BR')}</dd></div>
            <div><dt style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Atualizada em</dt><dd style={{ fontWeight: 500 }}>{new Date(org.updatedAt).toLocaleString('pt-BR')}</dd></div>
          </dl>
        </div>

        <div style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: org.configuracoes?.corPrincipal || 'var(--color-primary)' }} />
            Configurações de Identidade Visual
          </h3>
          <dl style={{ display: 'grid', gap: '0.75rem' }}>
            <div><dt style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Nome da Igreja</dt><dd style={{ fontWeight: 500 }}>{org.configuracoes?.nomeIgreja || '—'}</dd></div>
            <div><dt style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cor Principal</dt><dd style={{ fontWeight: 500, fontFamily: 'monospace' }}>{org.configuracoes?.corPrincipal || '—'}</dd></div>
            <div><dt style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Logo</dt><dd style={{ fontWeight: 500 }}>{org.configuracoes?.logoUrl ? 'Definida' : 'Não definida'}</dd></div>
            <div><dt style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Endereço (Rodapé)</dt><dd style={{ fontWeight: 500 }}>{org.configuracoes?.rodapeEndereco || '—'}</dd></div>
            <div><dt style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Telefone (Rodapé)</dt><dd style={{ fontWeight: 500 }}>{org.configuracoes?.rodapeTelefone || '—'}</dd></div>
            <div><dt style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Email (Rodapé)</dt><dd style={{ fontWeight: 500 }}>{org.configuracoes?.rodapeEmail || '—'}</dd></div>
            <div><dt style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>WhatsApp (Rodapé)</dt><dd style={{ fontWeight: 500 }}>{org.configuracoes?.rodapeWhatsapp || '—'}</dd></div>
            <div><dt style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>YouTube</dt><dd style={{ fontWeight: 500 }}>{org.configuracoes?.rodapeYoutube || '—'}</dd></div>
            <div><dt style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Instagram</dt><dd style={{ fontWeight: 500 }}>{org.configuracoes?.rodapeInstagram || '—'}</dd></div>
            <div><dt style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Facebook</dt><dd style={{ fontWeight: 500 }}>{org.configuracoes?.rodapeFacebook || '—'}</dd></div>
          </dl>
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
        <h3 style={{ marginBottom: '1rem' }}>Ações Rápidas</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <Link href={`/admin/membros?organizacaoId=${org.id}`}><Button icon={<Users size={16} />} variant="secondary">Gerenciar Membros</Button></Link>
          <Link href={`/admin/lideranca?organizacaoId=${org.id}`}><Button icon={<UserCheck size={16} />} variant="secondary">Gerenciar Liderança</Button></Link>
          <Link href={`/admin/eventos?organizacaoId=${org.id}`}><Button icon={<Calendar size={16} />} variant="secondary">Gerenciar Eventos</Button></Link>
          <Link href={`/admin/financeiro?organizacaoId=${org.id}`}><Button icon={<DollarSign size={16} />} variant="secondary">Financeiro</Button></Link>
          <Link href={`/admin/configuracoes?organizacaoId=${org.id}`}><Button icon={<Edit size={16} />} variant="secondary">Configurações</Button></Link>
          <Link href={`/admin/configuracoes/site?organizacaoId=${org.id}`}><Button icon={<Edit size={16} />} variant="secondary">Editar Site Público</Button></Link>
        </div>
      </div>
    </div>
  );
}