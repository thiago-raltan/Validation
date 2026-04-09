/** Categorias de produtos da loja */
export type CategoriaProduto = 'pelucia' | 'figura' | 'box' | 'acessorio';

/** Mapa de categorias para exibição */
export const CATEGORIAS_PRODUTO: Record<CategoriaProduto, string> = {
  pelucia: 'Pelúcia',
  figura: 'Figura',
  box: 'Box / Booster',
  acessorio: 'Acessório',
};

/** Interface de produto (pelúcia, figura, box, acessório) */
export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  categoria: CategoriaProduto;
  imagemUrl: string;
  quantidadeEstoque: number;
  destaque: boolean;
}

/** Filtros para listagem de produtos */
export interface FiltrosProduto {
  busca?: string;
  categoria?: CategoriaProduto;
  precoMin?: number;
  precoMax?: number;
  pagina?: number;
  itensPorPagina?: number;
}
