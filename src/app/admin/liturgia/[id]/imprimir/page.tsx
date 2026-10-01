'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from '../../liturgia.module.css';

const MOMENTO_LABELS: Record<string, string> = {
  ABERTURA: 'Abertura', LOUVOR: 'Louvor', ORACAO: 'Oracao', DIZIMOS: 'Dizimos',
  ALAS: 'Alas', DINAMICA: 'Dinamica', MENSAGEM: 'Mensagem', RESPOSTA: 'Resposta',
  COMUNICADOS: 'Comunicados', BENCAO: 'Bencao', MUSICA_ESPECIAL: 'Musica Especial',
  TESTEMUNHO: 'Testemunho', CEIA: 'Ceia', BAPTISMO: 'Batismo', OUTRO: 'Outro',
};

export default function ImprimirLiturgiaPage() {
  const params = useParams();
  const id = params.id as string;
  const [liturgia, setLiturgia] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/liturgia/${id}`).then(r => r.json()).then(d => {
      setLiturgia(d.liturgia);
    });
  }, [id]);

  useEffect(() => {
    if (liturgia) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [liturgia]);

  if (!liturgia) return <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando...</div>;

  const dt = new Date(liturgia.data + 'T12:00:00');
  const dataFormatada = `${dt.getDate()} de ${['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][dt.getMonth()]} de ${dt.getFullYear()}`;

  return (
    <div>
      <button onClick={() => window.print()} className="no-print" style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 100, padding: '0.6rem 1.25rem', background: 'var(--gradient-gold)', color: '#000', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer' }}>
        Imprimir
      </button>
      <div className={styles.printContainer}>
        <div className={styles.printHeader}>
          <h1>{liturgia.tema || 'Liturgia do Culto'}</h1>
          <p><strong>Data:</strong> {dataFormatada} | <strong>Horario:</strong> {liturgia.horarioInicio}{liturgia.horarioFimPrevisto ? ` - ${liturgia.horarioFimPrevisto}` : ''}</p>
          <p><strong>Tipo:</strong> {liturgia.tipoCulto} | <strong>Igreja:</strong> {liturgia.organizacao?.nome}</p>
          {liturgia.dirigente && <p><strong>Dirigente:</strong> {liturgia.dirigente}</p>}
          {liturgia.pregador && <p><strong>Pregador:</strong> {liturgia.pregador}</p>}
          {liturgia.responsavel && <p><strong>Responsavel:</strong> {liturgia.responsavel}</p>}
        </div>
        {liturgia.itens.map((item: any) => (
          <div key={item.id} className={styles.printMomento}>
            <div className={styles.printMomentoTitle}>{item.ordem}. {MOMENTO_LABELS[item.tipo] || item.tipo} - {item.titulo}</div>
            <div className={styles.printMomentoMeta}>
              {item.horarioPrevisto && `Horario: ${item.horarioPrevisto}`}
              {item.duracaoPrevista && ` | Duracao: ${item.duracaoPrevista}min`}
              {item.responsavel && ` | Responsavel: ${item.responsavel}`}
            </div>
            {item.descricao && <div className={styles.printMomentoDesc}>{item.descricao}</div>}
            {item.musica && <div className={styles.printMomentoDesc}>Musica: {item.musica.titulo}{item.musica.tom ? ` (Tom: ${item.musica.tom})` : ''}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}