import { notFound } from 'next/navigation';
import { MapPin, Calendar, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatarDataLonga, formatarHora } from '@/lib/datas';
import InscricaoForm from '@/components/public/InscricaoForm';

export const dynamic = 'force-dynamic';

async function getEvento(id: string) {
  try {
    const evento = await prisma.evento.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        tema: true,
        dataEvento: true,
        dataInicio: true,
        dataFim: true,
        local: true,
        status: true,
        observacoes: true,
        publicarNoSite: true,
        aceitaInscricoes: true,
        limiteInscricoes: true,
        taxaInscricao: true,
        preletores: true,
        organizacao: { select: { nome: true } },
      },
    });
    if (!evento || !evento.publicarNoSite) return null;

    const inscricoes = await prisma.inscricao.count({
      where: { eventoId: id, status: { in: ['PENDENTE', 'CONFIRMADA'] } },
    });

    return {
      ...evento,
      inscricoes,
      vagasRestantes:
        evento.limiteInscricoes != null ? Math.max(0, evento.limiteInscricoes - inscricoes) : null,
    };
  } catch {
    return null;
  }
}

export default async function EventoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const evento = await getEvento(id);
  if (!evento) notFound();

  return (
    <>
      <div className="page-header">
        <div className="container">
          <Link
            href="/eventos"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
              color: 'var(--color-primary)', marginBottom: '1.15rem', fontSize: '0.885rem',
            }}
          >
            <ArrowLeft size={15} /> Voltar aos eventos
          </Link>
          <h1>{evento.nome}</h1>
          {evento.tema && <p>{evento.tema}</p>}
        </div>
      </div>

      <section>
        <div className="container">
          <div className="grid-2" style={{ gap: '3rem', alignItems: 'start' }}>
            <div>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '3rem', height: '3rem', borderRadius: 'var(--radius-md)',
                    background: 'var(--gradient-gold)', color: '#fff', display: 'grid', placeItems: 'center',
                    fontFamily: "'Playfair Display', serif", fontSize: '1.35rem', flexShrink: 0,
                  }}>
                    {new Date(evento.dataEvento).getUTCDate()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{formatarDataLonga(evento.dataEvento)}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.885rem', margin: 0 }}>
                      {formatarHora(evento.dataInicio || evento.dataEvento)}
                    </p>
                  </div>
                </div>

                {evento.local && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-secondary)' }}>
                    <MapPin size={18} style={{ color: 'var(--color-primary)' }} />
                    <span>{evento.local}</span>
                  </div>
                )}

                {evento.preletores && evento.preletores.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-secondary)' }}>
                    <Users size={18} style={{ color: 'var(--color-primary)' }} />
                    <span>Prelecao: {evento.preletores.join(', ')}</span>
                  </div>
                )}

                {evento.observacoes && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.05rem', color: 'var(--text-muted)', lineHeight: 1.75 }}>
                    {evento.observacoes}
                  </div>
                )}

                <div style={{
                  display: 'flex', gap: '0.65rem', flexWrap: 'wrap',
                  borderTop: '1px solid var(--border-color)', paddingTop: '1.05rem',
                }}>
                  <span className="badge badgeOk" style={{ background: 'rgba(76,175,80,.16)', color: '#7ee08a', border: '1px solid rgba(76,175,80,.32)' }}>
                    {evento.status.replace(/_/g, ' ')}
                  </span>
                  {evento.aceitaInscricoes && (
                    <span className="badge" style={{ background: 'var(--gradient-gold-soft)', color: 'var(--color-primary)', border: '1px solid var(--border-hover)' }}>
                      INSCRICOES ABERTAS
                    </span>
                  )}
                  {evento.vagasRestantes != null && (
                    <span className="badge" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                      {evento.vagasRestantes} VAGAS RESTANTES
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <InscricaoForm
                eventoId={evento.id}
                taxa={evento.taxaInscricao ? Number(evento.taxaInscricao) : 0}
                aceitaInscricoes={evento.aceitaInscricoes}
                vagasRestantes={evento.vagasRestantes}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
