/** Interface que representa uma carta do catálogo */
export interface Carta {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  raridade: string;
  tipo: string;
  conjunto: string;
  conjuntoId: number;
  imagemUrl: string;
  quantidadeEstoque: number;
  numero: string;
  codigoColecao?: string;
  artista?: string;
  hp?: number;
  destaque?: boolean;
}

/** Lista legada de raridades descritivas da aplicação */
export enum Raridade {
  COMUM = 'Comum',
  INCOMUM = 'Incomum',
  RARO = 'Raro',
  RARO_HOLO = 'Raro Holo',
  ULTRA_RARO = 'Ultra Raro',
  SECRETO = 'Secreto',
}

/** Sugestões para cadastro manual com base em catálogos de TCG japonês */
export const RARIDADES_CARTA_SUGERIDAS = [
  'C',
  'U',
  'R',
  'RR',
  'RRR',
  'SR',
  'HR',
  'UR',
  'AR',
  'SAR',
  'ACE SPEC',
  'PROMO',
  Raridade.COMUM,
  Raridade.INCOMUM,
  Raridade.RARO,
  Raridade.RARO_HOLO,
  Raridade.ULTRA_RARO,
  Raridade.SECRETO,
] as const;

/** Interface usada nos filtros do catálogo */
export interface FiltrosCarta {
  busca?: string;
  conjuntoId?: number;
  tipo?: string;
  raridade?: string;
  precoMin?: number;
  precoMax?: number;
  pagina?: number;
  itensPorPagina?: number;
}

/** Interface de resposta paginada da API */
export interface RespostaPaginada<T> {
  dados: T[];
  total: number;
  pagina: number;
  itensPorPagina: number;
  totalPaginas: number;
}
