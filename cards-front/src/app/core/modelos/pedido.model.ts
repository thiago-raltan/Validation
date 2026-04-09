/** Status possíveis de um pedido */
export type StatusPedido =
  | 'pendente'
  | 'pago'
  | 'em_separacao'
  | 'enviado'
  | 'entregue'
  | 'cancelado';

/** Mapa de status para exibição legível */
export const STATUS_PEDIDO: Record<StatusPedido, string> = {
  pendente: 'Aguardando Pagamento',
  pago: 'Pago',
  em_separacao: 'Em Separação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

/** Cores por status para badges */
export const COR_STATUS_PEDIDO: Record<StatusPedido, string> = {
  pendente: '#f59e0b',
  pago: '#3b82f6',
  em_separacao: '#8b5cf6',
  enviado: '#06b6d4',
  entregue: '#10b981',
  cancelado: '#ef4444',
};

/** Item de um pedido */
export interface ItemPedido {
  id: number;
  cartaId?: number;
  produtoId?: number;
  nomeProduto: string;
  imagemUrl?: string;
  quantidade: number;
  precoUnitario: number;
}

/** Endereço de entrega de um pedido */
export interface EnderecoEntrega {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

/** Pedido completo */
export interface Pedido {
  id: number;
  usuarioId: number;
  nomeCliente: string;
  emailCliente: string;
  itens: ItemPedido[];
  status: StatusPedido;
  total: number;
  formaPagamento: string;
  enderecoEntrega?: EnderecoEntrega;
  dataCriacao: string;
  dataAtualizacao: string;
}

/** Corpo para criação de um novo pedido (checkout) */
export interface CriarPedido {
  itens: Array<{ cartaId?: number; produtoId?: number; quantidade: number }>;
  enderecoEntrega: EnderecoEntrega;
  formaPagamento: 'pix' | 'cartao' | 'boleto';
}

/** Resumo do dashboard admin */
export interface ResumoAdmin {
  totalCartas: number;
  totalProdutos: number;
  totalPedidos: number;
  pedidosPendentes: number;
  totalUsuarios: number;
  faturamentoMes: number;
}
