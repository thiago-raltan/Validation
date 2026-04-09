import { Carta } from './carta.model';
import { Produto } from './produto.model';

/** Interface que representa um item dentro do carrinho de compras.
 *  Pode ser uma carta OU um produto — exatamente um dos dois será preenchido. */
export interface ItemCarrinho {
  carta?: Carta;
  produto?: Produto;
  quantidade: number;
}

/** Interface que representa o carrinho completo */
export interface Carrinho {
  itens: ItemCarrinho[];
  subtotal: number;
  desconto: number;
  total: number;
}
