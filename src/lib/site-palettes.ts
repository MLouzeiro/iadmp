/**
 * Paletas de cores para o site público da congregação (/igreja/[slug]).
 * Cada paleta mapeia para as variáveis CSS --site-*.
 * PADRAO = azul-marinho (novo layout). OURO = identidade atual IADMP.
 * Meses = campanhas sazonais (Novembro Azul, Outubro Rosa, etc.).
 */
export interface PaletaSite {
  id: string;
  nome: string;
  primaria: string;   // botões, links, selos
  navy: string;       // top bar, hero overlay, ministérios, barra final
  fundoClaro: string; // faixas e painéis
  texto: string;
  textoSec: string;
  verde: string;      // botão WhatsApp
  branco: string;
}

export const PALETAS_SITE: Record<string, PaletaSite> = {
  PADRAO: {
    id: 'PADRAO',
    nome: 'Padrão (Azul Marinho)',
    primaria: '#0B5C8E',
    navy: '#0B2A4A',
    fundoClaro: '#F2F7FB',
    texto: '#1F2A37',
    textoSec: '#5B6B7B',
    verde: '#1B7A4E',
    branco: '#FFFFFF',
  },
  OURO: {
    id: 'OURO',
    nome: 'Ouro (Identidade IADMP)',
    primaria: '#C9A84C',
    navy: '#0A1628',
    fundoClaro: '#F5E6C8',
    texto: '#1A1A1A',
    textoSec: '#6B6B6B',
    verde: '#1B7A4E',
    branco: '#FFFFFF',
  },
  JANEIRO: {
    id: 'JANEIRO',
    nome: 'Janeiro — Ano Novo',
    primaria: '#2E7D32',
    navy: '#1B5E20',
    fundoClaro: '#E8F5E9',
    texto: '#1B2A1B',
    textoSec: '#5B6B5B',
    verde: '#1B7A4E',
    branco: '#FFFFFF',
  },
  FEVEREIRO: {
    id: 'FEVEREIRO',
    nome: 'Fevereiro — Amor e Caridade',
    primaria: '#C2185B',
    navy: '#880E4F',
    fundoClaro: '#FCE4EC',
    texto: '#2A1A22',
    textoSec: '#7B5B6B',
    verde: '#1B7A4E',
    branco: '#FFFFFF',
  },
  MARCO: {
    id: 'MARCO',
    nome: 'Março — Primavera / Mulheres',
    primaria: '#7B1FA2',
    navy: '#4A148C',
    fundoClaro: '#F3E5F5',
    texto: '#2A1A32',
    textoSec: '#7B5B8B',
    verde: '#1B7A4E',
    branco: '#FFFFFF',
  },
  ABRIL: {
    id: 'ABRIL',
    nome: 'Abril — Páscoa',
    primaria: '#F9A825',
    navy: '#E65100',
    fundoClaro: '#FFF8E1',
    texto: '#2A221A',
    textoSec: '#7B705B',
    verde: '#1B7A4E',
    branco: '#FFFFFF',
  },
  MAIO: {
    id: 'MAIO',
    nome: 'Maio — Mães',
    primaria: '#D81B60',
    navy: '#AD1457',
    fundoClaro: '#FCE4EC',
    texto: '#2A1A22',
    textoSec: '#7B5B6B',
    verde: '#1B7A4E',
    branco: '#FFFFFF',
  },
  JUNHO: {
    id: 'JUNHO',
    nome: 'Junho — Festa Junina',
    primaria: '#E64A19',
    navy: '#BF360C',
    fundoClaro: '#FBE9E7',
    texto: '#2A1A12',
    textoSec: '#7B5B4B',
    verde: '#1B7A4E',
    branco: '#FFFFFF',
  },
  JULHO: {
    id: 'JULHO',
    nome: 'Julho — Inverno',
    primaria: '#0277BD',
    navy: '#01579B',
    fundoClaro: '#E1F5FE',
    texto: '#1A222A',
    textoSec: '#5B6B7B',
    verde: '#1B7A4E',
    branco: '#FFFFFF',
  },
  AGOSTO: {
    id: 'AGOSTO',
    nome: 'Agosto — Pais',
    primaria: '#1565C0',
    navy: '#0D47A1',
    fundoClaro: '#E3F2FD',
    texto: '#1A1F2A',
    textoSec: '#5B657B',
    verde: '#1B7A4E',
    branco: '#FFFFFF',
  },
  SETEMBRO: {
    id: 'SETEMBRO',
    nome: 'Setembro — Primavera',
    primaria: '#00897B',
    navy: '#004D40',
    fundoClaro: '#E0F2F1',
    texto: '#1A2A28',
    textoSec: '#5B7B78',
    verde: '#1B7A4E',
    branco: '#FFFFFF',
  },
  OUTUBRO: {
    id: 'OUTUBRO',
    nome: 'Outubro — Outubro Rosa',
    primaria: '#E91E8C',
    navy: '#880E4F',
    fundoClaro: '#FCE4EC',
    texto: '#2A1A22',
    textoSec: '#7B5B6B',
    verde: '#1B7A4E',
    branco: '#FFFFFF',
  },
  NOVEMBRO: {
    id: 'NOVEMBRO',
    nome: 'Novembro — Novembro Azul',
    primaria: '#1E88E5',
    navy: '#0D47A1',
    fundoClaro: '#E3F2FD',
    texto: '#1A1F2A',
    textoSec: '#5B657B',
    verde: '#1B7A4E',
    branco: '#FFFFFF',
  },
  DEZEMBRO: {
    id: 'DEZEMBRO',
    nome: 'Dezembro — Natal',
    primaria: '#C62828',
    navy: '#B71C1C',
    fundoClaro: '#FFEBEE',
    texto: '#2A1A1A',
    textoSec: '#7B5B5B',
    verde: '#1B7A4E',
    branco: '#FFFFFF',
  },
};

export const PALETA_PADRAO = PALETAS_SITE.PADRAO;

export function resolverPaleta(id: string | null | undefined): PaletaSite {
  if (id && PALETAS_SITE[id]) return PALETAS_SITE[id];
  return PALETA_PADRAO;
}

export const LISTA_PALETAS = Object.values(PALETAS_SITE);
