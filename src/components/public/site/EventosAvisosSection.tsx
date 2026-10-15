'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Clock, ArrowRight, Megaphone } from 'lucide-react';

interface Evento {
  id: string;
  nome: string;
  tema?: string | null;
  dataEvento: string;
  local?: string | null;
  descricao?: string | null;
}

interface Aviso {
  id: string;
  titulo: string;
  descricao: string;
  comecaEm: string;
}

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function seloData(iso: string) {
  const d = new Date(iso);
  return { dow: DIAS[d.getDay()], day: d.getDate(), mon: MESES[d.getMonth()] };
}

function horaBR(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function EventosAvisosSection({ slug }: { slug: string }) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  useEffect(() => {
    fetch(`/api/public/eventos?slug=${slug}&limit=3`)
      .then((r) => r.json())
      .then((d) => setEventos(d.eventos || []))
      .catch(() => setEventos([]));

    fetch(`/api/public/avisos?slug=${slug}`)
      .then((r) => (r.ok ? r.json() : { avisos: [] }))
      .then((d) => setAvisos((d.avisos || []).slice(0, 4)))
      .catch(() => setAvisos([]));
  }, [slug]);

  return (
    <section className="eventosAvisos" id="eventos">
      <div className="eaGrid">
        <div>
          <div className="eaHeader">
            <div className="eaTitle">
              <Calendar size={22} />
              <h2>Próximos Eventos</h2>
            </div>
            <Link href={`/igreja/${slug}/eventos`} className="eaLink">
              Ver todos os eventos <ArrowRight size={15} />
            </Link>
          </div>
          <div className="eventosGrid">
            {eventos.length === 0 && (
              <p style={{ color: '#5B6B7B', fontSize: '0.9rem' }}>Em breve novos eventos serão anunciados.</p>
            )}
            {eventos.map((e) => {
              const selo = seloData(e.dataEvento);
              return (
                <Link key={e.id} href={`/igreja/${slug}/eventos`} className="eventoCard">
                  <div className="eventoImg">
                    <div className="eventoDate">
                      <div className="eventoDateDow">{selo.dow}</div>
                      <div className="eventoDateDay">{selo.day}</div>
                      <div className="eventoDateMon">{selo.mon}</div>
                    </div>
                  </div>
                  <div className="eventoBody">
                    <h3>{e.nome}</h3>
                    <div className="eventoMeta"><Clock size={14} /> {horaBR(e.dataEvento)}</div>
                    {e.local && (
                      <div className="eventoMeta"><MapPin size={14} /> {e.local}</div>
                    )}
                    {e.descricao && <p className="eventoDesc">{e.descricao.slice(0, 100)}...</p>}
                    <span className="eventoBtn">Mais detalhes <ArrowRight size={14} /></span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {avisos.length > 0 && (
          <aside className="avisosPanel" id="avisos" aria-label="Avisos">
            <div className="avisosHeader">
              <div className="avisosTitle">
                <Megaphone size={20} />
                <h3>Avisos</h3>
              </div>
              <Link href={`/igreja/${slug}#avisos`} className="avisosVer">Ver todos →</Link>
            </div>
            {avisos.map((a) => {
              const selo = seloData(a.comecaEm);
              return (
                <div key={a.id} className="avisoItem">
                  <div className="avisoDate">
                    <div className="avisoDateDay">{selo.day}</div>
                    <div className="avisoDateMon">{selo.mon}</div>
                  </div>
                  <div className="avisoBody">
                    <h4>{a.titulo}</h4>
                    <p>{a.descricao.slice(0, 90)}...</p>
                  </div>
                </div>
              );
            })}
            <div className="avisosFooter">
              <Link href={`/igreja/${slug}#avisos`}>
                Ver todos os avisos <ArrowRight size={14} />
              </Link>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
