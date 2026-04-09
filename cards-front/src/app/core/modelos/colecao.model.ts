/** Interface que representa um conjunto/coleção de cartas */
export interface Colecao {
  id: number;
  nome: string;
  descricao: string;
  imagemUrl: string;
  logoUrl: string;
  dataLancamento: string;
  totalCartas: number;
  serie: string;
}
