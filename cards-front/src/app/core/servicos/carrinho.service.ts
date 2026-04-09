import { Injectable, signal, computed } from '@angular/core';
import { Carta } from '../modelos/carta.model';
import { Produto } from '../modelos/produto.model';
import { Carrinho, ItemCarrinho } from '../modelos/carrinho.model';

/** Chaves únicas para diferenciar cartas de produtos no carrinho */
function chaveItem(item: ItemCarrinho): string {
  if (item.carta) return `carta-${item.carta.id}`;
  if (item.produto) return `produto-${item.produto.id}`;
  return '';
}

function precoItem(item: ItemCarrinho): number {
  return item.carta?.preco ?? item.produto?.preco ?? 0;
}

function estoqueItem(item: ItemCarrinho): number {
  return item.carta?.quantidadeEstoque ?? item.produto?.quantidadeEstoque ?? 0;
}

/**
 * Serviço do carrinho de compras.
 * Usa Signals do Angular 17 para reatividade sem necessidade de Subject/BehaviorSubject.
 * Os dados são persistidos no localStorage do navegador.
 * Suporta tanto cartas quanto produtos.
 */
@Injectable({
  providedIn: 'root',
})
export class CarrinhoService {
  /** Lista de itens do carrinho como Signal reativo */
  private _itens = signal<ItemCarrinho[]>(this.carregarDoStorage());

  /** Itens do carrinho (somente leitura) */
  readonly itens = this._itens.asReadonly();

  /** Quantidade total de itens no carrinho */
  readonly quantidadeTotal = computed(() =>
    this._itens().reduce((total, item) => total + item.quantidade, 0)
  );

  /** Subtotal sem descontos */
  readonly subtotal = computed(() =>
    this._itens().reduce(
      (total, item) => total + precoItem(item) * item.quantidade,
      0
    )
  );

  /** Total final (sem desconto por enquanto) */
  readonly total = computed(() => this.subtotal());

  /** Objeto completo do carrinho */
  readonly carrinho = computed<Carrinho>(() => ({
    itens: this._itens(),
    subtotal: this.subtotal(),
    desconto: 0,
    total: this.total(),
  }));

  /** Adiciona uma carta ao carrinho. Se já existir, incrementa a quantidade */
  adicionarCarta(carta: Carta, quantidade = 1): void {
    this._adicionarItem({ carta, quantidade: 0 }, quantidade);
  }

  /** Adiciona um produto ao carrinho. Se já existir, incrementa a quantidade */
  adicionarProduto(produto: Produto, quantidade = 1): void {
    this._adicionarItem({ produto, quantidade: 0 }, quantidade);
  }

  private _adicionarItem(novoItem: ItemCarrinho, quantidade: number): void {
    const chave = chaveItem(novoItem);
    const itensAtuais = this._itens();
    const indiceExistente = itensAtuais.findIndex(
      (item) => chaveItem(item) === chave
    );

    if (indiceExistente >= 0) {
      const novosItens = [...itensAtuais];
      novosItens[indiceExistente] = {
        ...novosItens[indiceExistente],
        quantidade: novosItens[indiceExistente].quantidade + quantidade,
      };
      this._itens.set(novosItens);
    } else {
      this._itens.set([...itensAtuais, { ...novoItem, quantidade }]);
    }

    this.salvarNoStorage();
  }

  /** Remove uma carta do carrinho pelo ID */
  removerCarta(cartaId: number): void {
    this._itens.set(
      this._itens().filter((item) => !(item.carta && item.carta.id === cartaId))
    );
    this.salvarNoStorage();
  }

  /** Remove um produto do carrinho pelo ID */
  removerProduto(produtoId: number): void {
    this._itens.set(
      this._itens().filter((item) => !(item.produto && item.produto.id === produtoId))
    );
    this.salvarNoStorage();
  }

  /** Atualiza a quantidade de um item pelo sua chave única */
  atualizarQuantidade(chave: string, quantidade: number): void {
    if (quantidade <= 0) {
      this._itens.set(this._itens().filter((item) => chaveItem(item) !== chave));
      this.salvarNoStorage();
      return;
    }

    const novosItens = this._itens().map((item) =>
      chaveItem(item) === chave ? { ...item, quantidade } : item
    );
    this._itens.set(novosItens);
    this.salvarNoStorage();
  }

  /** Esvazia completamente o carrinho */
  limparCarrinho(): void {
    this._itens.set([]);
    this.salvarNoStorage();
  }

  /** Verifica se uma carta já está no carrinho */
  estaNoCarrinho(cartaId: number): boolean {
    return this._itens().some((item) => item.carta && item.carta.id === cartaId);
  }

  /** Verifica se um produto já está no carrinho */
  produtoEstaNoCarrinho(produtoId: number): boolean {
    return this._itens().some((item) => item.produto && item.produto.id === produtoId);
  }

  /** Obtém a chave única de um item para uso externo */
  obterChaveItem(item: ItemCarrinho): string {
    return chaveItem(item);
  }

  /** Obtém o preço unitário de um item */
  obterPrecoItem(item: ItemCarrinho): number {
    return precoItem(item);
  }

  /** Obtém o estoque disponível de um item */
  obterEstoqueItem(item: ItemCarrinho): number {
    return estoqueItem(item);
  }

  /** Salva o carrinho no localStorage para persistência */
  private salvarNoStorage(): void {
    try {
      localStorage.setItem('carrinho', JSON.stringify(this._itens()));
    } catch {
      // Ignora erros de localStorage (modo privado ou armazenamento cheio)
    }
  }

  /** Carrega o carrinho do localStorage ao iniciar */
  private carregarDoStorage(): ItemCarrinho[] {
    try {
      const dados = localStorage.getItem('carrinho');
      return dados ? JSON.parse(dados) : [];
    } catch {
      return [];
    }
  }
}
